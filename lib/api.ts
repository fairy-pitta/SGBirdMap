/// lib/api.ts
// ----------------------------------------------------------
// All data-fetch helpers for the front-end (read-only).
//
// 以前は Supabase を直接呼んでいた（anon key がバンドルに載っていた）。
// Supabase プロジェクトごと失われたため、Cloudflare D1 を読む同一オリジンの
// Worker API（/api/*）に差し替えた。鍵はクライアントへ出ない。
// ----------------------------------------------------------
import type { BirdObservation } from "@/types/birds"

export type Species = { code: string; comName: string; sciName: string }

const fallbackObservations: BirdObservation[] = [
  {
    speciesCode: "redjun",
    comName: "Red Junglefowl",
    sciName: "Gallus gallus",
    locId: "L1234567",
    locName: "Pulau Ubin",
    obsDt: "2023-02-15",
    obsTime: "08:30",
    howMany: 2,
    lat: 1.3521,
    lng: 103.8198,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    userDisplayName: "birdwatcher_sg",
  },
  {
    speciesCode: "whbsea",
    comName: "White-bellied Sea-Eagle",
    sciName: "Haliaeetus leucogaster",
    locId: "L87654321",
    locName: "Bukit Timah Nature Reserve",
    obsDt: "2023-05-21",
    obsTime: "09:15",
    howMany: 1,
    lat: 1.2956,
    lng: 103.7764,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    userDisplayName: "wildlife_fan",
  },
]

// サンプル種リスト（APIが失敗した場合のフォールバック）
const fallbackSpecies: Species[] = [
  { code: "redjun", comName: "Red Junglefowl", sciName: "Gallus gallus" },
  { code: "whbsea", comName: "White-bellied Sea-Eagle", sciName: "Haliaeetus leucogaster" },
]

/**
 * 同一オリジンの Worker を叩く。静的書き出しした画面と同じホストに
 * /api/* が同居しているので、ベースURLの設定は要らない。
 */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

function query(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
  const s = sp.toString()
  return s ? `?${s}` : ""
}

// ---------- 1) Fetch observation records -------------------------
export async function fetchBirdObservations(
  speciesCode?: string,
  startDate?: string,
  endDate?: string,
): Promise<BirdObservation[]> {
  try {
    const rows = await getJson<BirdObservation[]>(
      `/api/observations${query({ species: speciesCode, start: startDate, end: endDate })}`,
    )
    // 期間に記録が無いのは正常。フォールバックの見本データで埋めない
    // （実データと見本が混ざると、地図の内容を信じられなくなる）。
    return rows
  } catch (err) {
    console.error("D1 query failed:", err)
    return fallbackObservations
  }
}

// ---------- 2) Alias for one species -----------------------------
export async function fetchSpeciesObservations(
  speciesCode: string,
  startDate?: string,
  endDate?: string,
) {
  return fetchBirdObservations(speciesCode, startDate, endDate)
}

// ---------- 3) Fetch species master list ------------------------
export async function fetchSpeciesInSingapore(): Promise<Species[]> {
  try {
    return await getJson<Species[]>("/api/species")
  } catch (err) {
    console.error("D1 query failed:", err)
    return fallbackSpecies
  }
}
