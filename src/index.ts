export interface Env {
	// Secrets
	NTFY_URL: string;
	NTFY_TOKEN: string;
	LATITUDE: string;
	LONGITUDE: string;

	// Variables
	DEBUG_SEND: boolean;
	MODELS: string;
	TIMEZONE: string;
	CHECK_UNTIL_HOUR: number;
}

interface OpenMeteoForecast {
	hourly?: {
		time?: string[];
		weather_code?: number[];
	};
}

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO codes for rain, freezing rain, showers, and thunderstorms.
const RAIN_WEATHER_CODES = new Set([
	53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

function decodeTimezone(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function getLocalDateAndHour(timezone: string, now = new Date()): { date: string; hour: number } {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hourCycle: "h23",
	}).formatToParts(now);
	const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value;
	const year = valueFor("year");
	const month = valueFor("month");
	const day = valueFor("day");
	const hour = valueFor("hour");

	if (!year || !month || !day || hour === undefined) {
		throw new Error("現在時刻を取得できませんでした。");
	}

	return { date: `${year}-${month}-${day}`, hour: Number(hour) };
}

function buildForecastUrl(env: Env, timezone: string): URL {
	const meteoParams: Record<string, string> = {
		latitude: env.LATITUDE,
		longitude: env.LONGITUDE,
		hourly: "weather_code",
		models: env.MODELS,
		timezone,
		forecast_days: "1",
	};

	const url = new URL(OPEN_METEO_FORECAST_URL);
	for (const [key, value] of Object.entries(meteoParams)) {
		url.searchParams.set(key, value);
	}
	return url;
}

function findFirstRainHour(
	forecast: OpenMeteoForecast,
	today: string,
	currentHour: number,
	untilHour: number,
): number | undefined {
	const times = forecast.hourly?.time ?? [];
	const weatherCodes = forecast.hourly?.weather_code ?? [];

	for (const [index, time] of times.entries()) {
		const hour = Number(time.slice(11, 13));
		if (
			time.startsWith(`${today}T`) &&
			hour >= currentHour &&
			hour <= untilHour &&
			RAIN_WEATHER_CODES.has(weatherCodes[index])
		) {
			return hour;
		}
	}
}

async function checkRainAndNotify(env: Env): Promise<void> {
	const timezone = decodeTimezone(env.TIMEZONE);
	const { date, hour } = getLocalDateAndHour(timezone);

	let notificationTitle = `雨予報（${date}）`;
	let notificationBody = "現在雨が降っています。";

	if (env.DEBUG_SEND) {
		notificationTitle = `【デバッグ】雨予報（${date}）`;
		notificationBody = "これはデバッグ送信テストです。";
		console.log("Debug mode enabled. Sending test notification without checking forecast result.");
	} else {
		const forecastResponse = await fetch(buildForecastUrl(env, timezone));

		if (!forecastResponse.ok) {
			throw new Error(`Open-Meteo request failed: ${forecastResponse.status}`);
		}

		const firstRainHour = findFirstRainHour(
			(await forecastResponse.json()) as OpenMeteoForecast,
			date,
			hour,
			env.CHECK_UNTIL_HOUR,
		);

		if (firstRainHour === undefined) {
			console.log(`No rain forecast through ${env.CHECK_UNTIL_HOUR}:00 on ${date}.`);
			return;
		}

		notificationBody =
			firstRainHour === hour
				? notificationBody
				: `${firstRainHour}時に雨が降る予報です。`;

		console.log(`Sending Rain notification for ${date} ${firstRainHour}:00.`);
	}

	const notificationResponse = await fetch(env.NTFY_URL, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Title": notificationTitle,
			...(env.NTFY_TOKEN && { 'Authorization': `Bearer ${env.NTFY_TOKEN}` }),
		},
		body: notificationBody,
	});

	if (!notificationResponse.ok) {
		throw new Error(`ntfy request failed: ${notificationResponse.status}`);
	}
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		url.pathname = "/__scheduled";
		url.searchParams.set("cron", "* * * * *");
		return new Response(
			`To test the scheduled handler, start Wrangler with "--test-scheduled" then request ${url.href}.`,
		);
	},

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(checkRainAndNotify(env));
		console.log(`Rain forecast check triggered by cron: ${controller.cron}`);
	},
} satisfies ExportedHandler<Env>;
