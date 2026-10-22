/**
 * 日次更新。eBird の recent エンドポイントを読んで D1 に upsert する。
 *
 * 前のこのアプリは「Supabase に入れたデータが止まり、やがてプロジェクトごと
 * 消えた」ことで死んだ。取り込みを人手に残さないため Worker の cron に置く。
 *
 * recent は「種ごとの最新1件」しか返さない。これは historic と同じ粒度なので、
 * 毎日呼べば日々の記録が積み上がる。back=7 で重ねて取るのは、取りこぼした日を
 * 翌日に拾い直すため（id が自然キーなので重複しても増えない）。
 */

const EBIRD_RECENT =
  "https://api.ebird.org/v2/data/obs/SG/recent?back=7&detail=full&maxResults=10000&includeProvisional=true";

export type RawObservation = {
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

/** build-sql.ts と同じ規則。片方だけ変えると同じ記録が二重に入る。 */
export function rowId(r: RawObservation, date: string): string {
  const base = r.subId || `${date}:${r.locId ?? "?"}`;
  return `${base}:${r.speciesCode}`;
}

export function splitObsDt(obsDt: string): { date: string; time: string | null } {
  const [date, time] = obsDt.split(" ");
  return { date, time: time ?? null };
}

export function isUsable(r: RawObservation): boolean {
  return Boolean(r.speciesCode) && Number.isFinite(r.lat) && Number.isFinite(r.lng);
}

export async function fetchRecent(apiKey: string): Promise<RawObservation[]> {
  const res = await fetch(EBIRD_RECENT, { headers: { "x-ebirdapitoken": apiKey } });
  if (!res.ok) throw new Error(`eBird API ${res.status}`);
  return (await res.json()) as RawObservation[];
}

export async function upsert(db: D1Database, rows: RawObservation[]): Promise<number> {
  const usable = rows.filter(isUsable);
  if (!usable.length) return 0;

  const species = db.prepare(
    "INSERT OR REPLACE INTO species (species_code,com_name,sci_name) VALUES (?,?,?)"
  );
  const obs = db.prepare(
    "INSERT OR REPLACE INTO observations" +
      " (id,species_code,obs_dt,obs_time,how_many,lat,lng,location_id,location_name," +
      "obs_valid,obs_reviewed) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  );

  const seen = new Set<string>();
  const statements: D1PreparedStatement[] = [];
  for (const r of usable) {
    if (!seen.has(r.speciesCode)) {
      seen.add(r.speciesCode);
      statements.push(species.bind(r.speciesCode, r.comName, r.sciName));
    }
    const { date, time } = splitObsDt(r.obsDt);
    statements.push(
      obs.bind(
        rowId(r, date),
        r.speciesCode,
        date,
        time,
        r.howMany ?? null,
        r.lat,
        r.lng,
        r.locId ?? null,
        r.locName ?? null,
        r.obsValid === false ? 0 : 1,
        r.obsReviewed ? 1 : 0
      )
    );
  }

  await db.batch(statements);
  return usable.length;
}
