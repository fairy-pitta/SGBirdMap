# 構成（2026-10-19 Supabase → Cloudflare D1 移行後）

```
sgbirdsmap.fairy-pitta.net
  └─ Cloudflare Worker "sgbirdmap"
       ├─ 静的アセット   out/（next build の output:'export'）
       └─ /api/*         worker/index.ts → D1 "sgbirdmap-db"
                            /api/species        種の一覧
                            /api/observations   期間・種で絞った観測記録
                            /api/health
```

## なぜ移したか

元は AWS Amplify（Next.js SSR）＋ Supabase だった。2026-10-19 時点で

- `sgbirdsmap.singbirds.net` … ドメイン singbirds.net を更新しない方針になった
- Supabase プロジェクト `nuspbbfhxkkdsasowabl` … **削除済みで名前解決すらできない**

つまりデータ層が失われていた。フロントは1ページ・APIルート無し・server action
無しなので、静的書き出し＋D1 を読む Worker に置き換えられた。

## データの粒度

eBird の `historic` / `recent` エンドポイントが返すのは **「その日・その種の
最新1件」**（`rank=mrec`）。全チェックリストを辿るには 1日あたり
`/product/lists` ＋ 各 `subId` の `/product/checklist/view` が必要で、23年分では
現実的でない。地図の用途は「いつ・どこで記録されたか」なので
**種 × 日 × 地点** の粒度を採用した。

`observations.id` は `subId:speciesCode`（subId が無い古い記録は
`date:locId:speciesCode`）。自然キーなので取り込みを何度流しても増えない。

## 取り込み

| | いつ | 何を |
|---|---|---|
| 初回バックフィル | 手動 | `npm run collect` → `npm run build:sql` → `npm run import:d1` |
| 日次更新 | cron `0 2 * * *`（SGT 10:00） | `worker/ingest.ts` が eBird の直近7日を upsert |

**eBird は同時リクエストを 429 で弾く**（2026-10-19 に並列6で実測、全件429）。
`collect-observations.ts` は直列が既定。23年分で約3時間かかるが、
`data/_collect_state.json` に進捗を残すので中断しても続きから走る。

日次更新を Worker の cron に置いたのは、**前回このアプリが死んだ原因が
「取り込みが止まり、やがてデータ層ごと消えた」ことだった**ため。人手の手順に
戻さない。

## 無料枠

D1 の無料プランは書き込み10万行/日。バックフィルは23年分でこれを超えるので、
`scripts/import-d1.sh` は失敗したファイル名を表示して止まる。翌日そこから
再開すればよい。
