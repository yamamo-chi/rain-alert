FROM node:24-slim

# ルート証明書パッケージをインストール
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# パッケージ定義をコピーしてインストール
COPY package*.json ./
RUN npm install

# ソースコードと設定をコピー
COPY . .

# Cloudflareへテレメトリを送信しないように設定（コンテナ停止の防止）
ENV WRANGLER_SEND_METRICS=false

# Wranglerのデフォルトポートを公開
EXPOSE 8787

CMD ["npm", "run", "start"]