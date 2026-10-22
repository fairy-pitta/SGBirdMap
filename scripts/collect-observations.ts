/**
 * eBird からシンガポールの観測記録を日付ごとに集める。
 *
 *   EBIRD_API_KEY=xxx npx tsx scripts/collect-observations.ts [--from YYYY-MM-DD] [--to YYYY-MM-DD]
 *
 * historic エンドポイントは「その日・その種の最新1件」を返す（rank=mrec）。
 * 全チェックリストを辿るには 1日あたり数十回の追加リクエストが必要になるが、
 * 地図の用途は「いつ・どこで記録されたか」なので種×日×地点の粒度で足りる。
 *
 * data/observations.jsonl に追記し、data/_collect_state.json に進捗を書く。
 * 中断しても次回は続きから始まる（23年分=8000日を一度に流せないため）。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.EBIRD_API_KEY;
if (!KEY) {
  console.error("EBIRD_API_KEY が未設定です（取得: https://ebird.org/api/keygen）");
  process.exit(1);
}

const OUT = "data/observations.jsonl";
const STATE = "data/_collect_state.json";
const BASE = "https://api.ebird.org/v2";
/**
 * eBird は同時リクエストを 429 で弾く（2026-10-19 に並列6で実測、全件429）。
 * 直列なら1件あたり約1秒で通るので、並列数は1を既定にする。上げるとまず
 * 429 になり、リトライで待つ分かえって遅くなる。
 */
const CONCURRENCY = Number(process.env.COLLECT_CONCURRENCY ?? 1);
/** 429 を避けるための間隔。1件あたりの応答が約1秒なので上乗せは少しで足る。 */
const RATE_LIMIT_MS = 250;
/** eBird のシンガポール記録が実質的に始まる年。これ以前は数件しかない。 */
const DEFAULT_FROM = "2003-01-01";

type Raw = {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  obsValid?: boolean;
  obsReviewed?: boolean;
  locationPrivate?: boolean;
  subId?: string;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function days(from: string, to: string): string[] {
  const out: string[] = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(`${from}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** 失敗は致命的でない（その日が欠けるだけ）。429/5xx は待って3回まで試す。 */
async function fetchDay(date: string): Promise<Raw[] | null> {
  const [y, m, d] = date.split("-").map(Number);
  const path =
    `/data/obs/SG/historic/${y}/${m}/${d}` +
    "?rank=mrec&detail=full&maxResults=10000&includeProvisional=true";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { "x-ebirdapitoken": KEY! } });
    if (res.ok) return (await res.json()) as Raw[];
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * attempt);
      continue;
    }
    console.warn(`  ${date}: HTTP ${res.status} — 飛ばす`);
    return null;
  }
  console.warn(`  ${date}: 3回失敗 — 飛ばす`);
  return null;
}

async function main(): Promise<void> {
  mkdirSync("data", { recursive: true });
  const state: { done: string[] } = existsSync(STATE)
    ? JSON.parse(readFileSync(STATE, "utf8"))
    : { done: [] };
  const done = new Set(state.done);

  const from = arg("from") ?? DEFAULT_FROM;
  const to = arg("to") ?? new Date().toISOString().slice(0, 10);
  const todo = days(from, to).filter((d) => !done.has(d));

  console.log(
    `${from} → ${to}: ${todo.length}日分（済 ${done.size}日）並列 ${CONCURRENCY}`
  );

  let rows = 0;
  let finished = 0;
  const save = () => writeFileSync(STATE, JSON.stringify({ done: [...done] }, null, 0));
  process.on("SIGINT", () => {
    save();
    console.log("\n中断 — 進捗を保存しました");
    process.exit(130);
  });

  // 取り出しは1本のカーソルを共有し、書き込みは追記なので順序を問わない。
  let cursor = 0;
  async function consume(): Promise<void> {
    while (cursor < todo.length) {
      const date = todo[cursor++];
      const recs = await fetchDay(date);
      if (recs !== null) {
        if (recs.length) {
          appendFileSync(OUT, recs.map((r) => JSON.stringify(r)).join("\n") + "\n");
        }
        rows += recs.length;
        done.add(date);
      }
      await sleep(RATE_LIMIT_MS);
      finished += 1;
      if (finished % 100 === 0 || finished === todo.length) {
        save();
        const pct = ((finished / todo.length) * 100).toFixed(1);
        console.log(`  [${finished}/${todo.length} ${pct}%] ${date} 累計 ${rows}件`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, consume));
  save();
  console.log(`完了: ${rows}件を ${OUT} に追記`);
}

main();
