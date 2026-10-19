/**
 * SGBirdMap の読み取り専用API。静的書き出しした画面がここを叩く。
 *
 * Supabase を直接呼んでいた頃は anon key がバンドルに載っていた。D1 に移して
 * からは鍵がクライアントへ出ないので、公開範囲はこのWorkerが決める。
 *
 * ルーティングは wrangler の assets 側で /api/* だけ Worker に先に回している
 * （run_worker_first）。それ以外のパスは out/ の静的ファイルが直接返る。
 */

import { buildObservationsQuery, isDate } from "./query";
import { fetchRecent, upsert } from "./ingest";

export interface Env {
  DB: D1Database;
  /** cron の取り込みだけが使う。画面側には出ない。 */
  EBIRD_API_KEY?: string;
}

/** 観測記録は過去のものが書き換わらないので、長めにキャッシュして良い。 */
const CACHE_CONTROL = "public, max-age=300, s-maxage=86400";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? CACHE_CONTROL : "no-store",
    },
  });
}

async function species(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT species_code, com_name, sci_name FROM species ORDER BY com_name"
  ).all<{ species_code: string; com_name: string; sci_name: string }>();

  return json(
    (results ?? []).map((r) => ({
      code: r.species_code,
      comName: r.com_name,
      sciName: r.sci_name,
    }))
  );
}

async function observations(env: Env, url: URL): Promise<Response> {
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  for (const [name, value] of [["start", start], ["end", end]] as const) {
    if (value && !isDate(value)) {
      return json({ error: `${name} は YYYY-MM-DD 形式で指定してください` }, 400);
    }
  }

  const { sql, binds } = buildObservationsQuery({
    species: url.searchParams.get("species"),
    start,
    end,
    limit: url.searchParams.get("limit"),
  });

  const { results } = await env.DB.prepare(sql)
    .bind(...binds)
    .all<Record<string, unknown>>();

  return json(
    (results ?? []).map((r) => ({
      speciesCode: r.species_code,
      comName: r.com_name,
      sciName: r.sci_name,
      locId: r.location_id ?? "",
      locName: r.location_name ?? "",
      obsDt: r.obs_dt,
      obsTime: r.obs_time ?? undefined,
      howMany: r.how_many ?? undefined,
      lat: r.lat,
      lng: r.lng,
      obsValid: r.obs_valid === 1,
      obsReviewed: r.obs_reviewed === 1,
      locationPrivate: false,
      userDisplayName: "",
    }))
  );
}

export default {
  /** 毎日 eBird から直近の記録を取り込む（wrangler.jsonc の triggers.crons）。 */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    if (!env.EBIRD_API_KEY) {
      console.error("EBIRD_API_KEY が未設定のため取り込みを飛ばした");
      return;
    }
    const rows = await fetchRecent(env.EBIRD_API_KEY);
    const n = await upsert(env.DB, rows);
    console.log(`eBird から ${rows.length}件取得、${n}件を upsert`);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "GET") return json({ error: "GET のみ" }, 405);

    try {
      if (url.pathname === "/api/health") return json({ status: "ok" });
      if (url.pathname === "/api/species") return species(env);
      if (url.pathname === "/api/observations") return observations(env, url);
      return json({ error: "not found" }, 404);
    } catch (err) {
      // 画面側はフォールバックを持つので、500 を返して黙らせない。
      console.error("D1 query failed:", err);
      return json({ error: "query failed" }, 500);
    }
  },
};
