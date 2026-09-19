# 概要
定期的に気象予報をチェックして、雨が降る場合はntfyでスマホに通知を送るツール。

## 初期設定
1. [.dev.vars.example](./.dev.vars.example) をコピーして `.dev.vars` にリネーム
2. リネームした `.dev.vars` 内の以下変数を設定
    - `NTFY_URL`: nftyで送る通知先のURL
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

## デバッグ送信
正常にnftyへ送信できるかテストしたい場合、[wrangler.jsonc](./wrangler.jsonc) 内の `DEBUG_SEND` を `true` に変更して起動。