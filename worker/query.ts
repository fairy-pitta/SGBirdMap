/**
 * /api/observations のクエリ組み立て。
 *
 * index.ts から切り出しているのは、D1 を立てずに「どのSQLとどの値を投げるか」
 * を検証できるようにするため。条件はSQL断片と値の配列を同じ順序で積むので、
 * 片方だけ直すと静かにズレる。そこをテストで押さえる。
 */

export const MAX_LIMIT = 20000;
export const DEFAULT_LIMIT = 5000;

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
