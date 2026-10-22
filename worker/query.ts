/**
 * /api/observations のクエリ組み立て。
 *
 * index.ts から切り出しているのは、D1 を立てずに「どのSQLとどの値を投げるか」
 * を検証できるようにするため。条件はSQL断片と値の配列を同じ順序で積むので、
 * 片方だけ直すと静かにズレる。そこをテストで押さえる。
 */

/**
 * 粒度が「種 × 日」なので、1種の件数は期間の日数を超えない。
 * 最長（2003-01-01 以降の全期間）でも 8,700 件程度。画面は必ず種を1つ
 * 選んでから取得するため、10,000 を既定にすれば取りこぼさない。
 */
export const DEFAULT_LIMIT = 10000;
export const MAX_LIMIT = 20000;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(value: string): boolean {
  return DATE.test(value);
}

export function clampLimit(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

export const SELECT_OBSERVATIONS =
  "SELECT o.species_code, s.com_name, s.sci_name, o.obs_dt, o.obs_time," +
  " o.how_many, o.lat, o.lng, o.location_id, o.location_name," +
  " o.obs_valid, o.obs_reviewed" +
  " FROM observations o JOIN species s ON s.species_code = o.species_code";

export type ObservationFilters = {
  species?: string | null;
  start?: string | null;
  end?: string | null;
  limit?: string | null;
};

export function buildObservationsQuery(
  filters: ObservationFilters
): { sql: string; binds: unknown[] } {
  const where: string[] = [];
  const binds: unknown[] = [];

  if (filters.species) {
    where.push("o.species_code = ?");
    binds.push(filters.species);
  }
  if (filters.start) {
    where.push("o.obs_dt >= ?");
    binds.push(filters.start);
  }
  if (filters.end) {
    where.push("o.obs_dt <= ?");
    binds.push(filters.end);
  }

  const sql =
    SELECT_OBSERVATIONS +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY o.obs_dt LIMIT ?";
  binds.push(clampLimit(filters.limit ?? null));

  return { sql, binds };
}
