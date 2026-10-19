/**
 * data/observations.jsonl を D1 に流せる SQL に変換する。
 *
 *   npx tsx scripts/build-sql.ts
 *
 * `wrangler d1 execute --file` はファイル全体を1リクエストで送るので、
 * 大きなファイルは弾かれる。Aviguessr と同じく 400KB 前後で分割する。
 */
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const IN = "data/observations.jsonl";
const OUT_DIR = "data/sql";
const BYTES_PER_FILE = 400_000;

type Raw = {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId?: string;
  locName?: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  obsValid?: boolean;
  obsReviewed?: boolean;
  subId?: string;
};

/** SQL文字列。D1 はパラメータ無しの生SQLを流すので、ここで必ず括る。 */
function q(v: string | undefined | null): string {
  if (v === undefined || v === null || v === "") return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

function num(v: number | undefined | null): string {
  return v === undefined || v === null || !Number.isFinite(v) ? "NULL" : String(v);
}

/**
 * 再取り込みで重複しないための自然キー。
 * subId（チェックリストID）があればそれ＋種コード。無い古い記録は
 * 日付・地点・種の組で代用する（同一記録が別IDで二重に入るのを防ぐ）。
 */
function rowId(r: Raw, date: string): string {
  const base = r.subId || `${date}:${r.locId ?? "?"}`;
  return `${base}:${r.speciesCode}`;
}

async function main(): Promise<void> {
  const speciesSeen = new Map<string, Raw>();
  const obsSeen = new Set<string>();
  const obsStatements: string[] = [];

  const rl = createInterface({ input: createReadStream(IN, "utf8"), crlfDelay: Infinity });
  let lines = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    lines += 1;
    const r = JSON.parse(line) as Raw;
    if (!r.speciesCode || !Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;

    if (!speciesSeen.has(r.speciesCode)) speciesSeen.set(r.speciesCode, r);

    // eBird の obsDt は "YYYY-MM-DD" か "YYYY-MM-DD HH:MM"。
    const [date, time] = r.obsDt.split(" ");
    const id = rowId(r, date);
    if (obsSeen.has(id)) continue;
    obsSeen.add(id);

    obsStatements.push(
      "INSERT OR REPLACE INTO observations (id,species_code,obs_dt,obs_time,how_many," +
        "lat,lng,location_id,location_name,obs_valid,obs_reviewed) VALUES (" +
        [
          q(id),
          q(r.speciesCode),
          q(date),
          q(time),
          num(r.howMany),
          num(r.lat),
          num(r.lng),
          q(r.locId),
          q(r.locName),
          r.obsValid === false ? 0 : 1,
          r.obsReviewed ? 1 : 0,
        ].join(",") +
        ");"
    );
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const speciesSql = [...speciesSeen.values()]
    .map(
      (r) =>
        "INSERT OR REPLACE INTO species (species_code,com_name,sci_name) VALUES (" +
        [q(r.speciesCode), q(r.comName), q(r.sciName)].join(",") +
        ");"
    )
    .join("\n");
  writeFileSync(`${OUT_DIR}/000-species.sql`, speciesSql + "\n");

  let file = 1;
  let buffer: string[] = [];
  let bytes = 0;
  const flush = () => {
    if (!buffer.length) return;
    writeFileSync(`${OUT_DIR}/${String(file).padStart(3, "0")}-obs.sql`, buffer.join("\n") + "\n");
    file += 1;
    buffer = [];
    bytes = 0;
  };
  for (const s of obsStatements) {
    if (bytes + s.length > BYTES_PER_FILE) flush();
    buffer.push(s);
    bytes += s.length + 1;
  }
  flush();

  console.log(`読み込み ${lines}行 → 種 ${speciesSeen.size} / 観測 ${obsStatements.length}`);
  console.log(`${OUT_DIR} に ${file} ファイル（観測 ${file - 1} + 種 1）`);
  console.log(`重複として落とした行: ${lines - obsStatements.length}`);
}

main();
