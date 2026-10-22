#!/usr/bin/env bash
# data/sql/*.sql を D1 に流す。--local か --remote を渡す（既定は --remote）。
#
# 無料プランは書き込み10万行/日。上限に当たると wrangler が失敗するので、
# そこで止めて「どのファイルまで入ったか」を表示する（翌日そこから再開できる）。
set -uo pipefail
TARGET="${1:---remote}"
DB="sgbirdmap-db"
W="./node_modules/.bin/wrangler"

for f in data/sql/*.sql; do
  printf '%s ... ' "$f"
  if ! $W d1 execute "$DB" "$TARGET" --file="$f" --yes >/dev/null 2>/private/tmp/d1-import-err.txt; then
    echo "失敗"
    echo "--- wrangler の出力 ---"
    tail -20 /private/tmp/d1-import-err.txt
    echo "ここまでは投入済み。次回はこのファイルから再開すること。"
    exit 1
  fi
  echo "ok"
done
echo "全ファイル投入完了"
