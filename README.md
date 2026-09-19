# 概要
定期的に気象予報をチェックして、雨が降る場合はntfyでスマホに通知を送るツール。

> [!warning]
> CloudFlare Workersではntfyに送信しても429になるため使えなかったので、実質Dockerでのオンプレ専用

## 初期設定
1. [.dev.vars.example](./.dev.vars.example) をコピーして `.dev.vars` にリネーム
2. リネームした `.dev.vars` 内の以下変数を設定
    - `NTFY_URL`: ntfyで送る通知先のURL
    - `NTFY_TOKEN`: ntfyで発行したアクセストークン（任意）
    - `LATITUDE`: 天気をチェックする緯度
    - `LONGITUDE`: 天気をチェックする経度

## デバッグ起動
1. 以下コマンドでローカルサーバー起動
``` cmd
npx wrangler dev --test-scheduled
```
2. 以下リンクにアクセスしてスケジュールジョブ実行
    - [http://127.0.0.1:8787/__scheduled?cron=*+*+*+*+*.](http://127.0.0.1:8787/__scheduled?cron=*+*+*+*+*.)

## デプロイ
### 初回デプロイ
以下コマンドをそれぞれ実行し、`.dev.vars` と同じ値を設定（ダブルクォーテーション無し）
``` cmd
npx wrangler secret put NTFY_URL
```
``` cmd
npx wrangler secret put NTFY_TOKEN
```
``` cmd
npx wrangler secret put LATITUDE
```
``` cmd
npx wrangler secret put LONGITUDE
```

### 通常デプロイ
``` cmd
npx wrangler deploy
```

## Docker起動
オンプレで動かす場合はDockerを利用。

1. `node_modules`、`.wrangler`を除いた本プロジェクトのファイルを任意の場所にコピー
2. `docker`ディレクトリに移動
3. 以下コマンドで起動
``` bash
docker compose up -d
```

## デバッグ送信
正常にntfyへ送信できるかテストしたい場合、[wrangler.jsonc](./wrangler.jsonc) 内の `DEBUG_SEND` を `true` に変更して起動。