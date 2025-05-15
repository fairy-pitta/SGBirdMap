/// lib/api.ts
// ----------------------------------------------------------
// All data-fetch helpers for the front-end (read-only).
// ----------------------------------------------------------
import { supabase } from "@/lib/supabaseClient"
import type { BirdObservation } from "@/types/birds" 

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
const fallbackSpecies = [
  {
    code: "redjun",
    comName: "Red Junglefowl",
    sciName: "Gallus gallus",
  },
  {
    code: "whbsea",
    comName: "White-bellied Sea-Eagle",
    sciName: "Haliaeetus leucogaster",
  },
]


// ---------- 1) Fetch observation records -------------------------
export async function fetchBirdObservations(
  speciesCode?: string,
  startDate?: string,
  endDate?: string,
): Promise<BirdObservation[]> {
  try {
    // Base query: ObservationSGBird JOIN ObservationSG + SGBird
    let q = supabase
      .from("ObservationSGBird")
      .select(
        `
        how_many,
        species_code,
        ObservationSG:observation_id (
          id,
          obs_dt,
          lat,
          lng,
          location_name,
          location_id,
          obs_valid,
          obs_reviewed,
          user_display_name
        ),
        SGBird:species_code (
          com_name,
          sci_name
        )
      `,
      )
      .order("obs_dt", { referencedTable: "ObservationSG" })

    // Filters
    if (speciesCode) q = q.eq("species_code", speciesCode)
    if (startDate)   q = q.gte("ObservationSG.obs_dt", startDate)
    if (endDate)     q = q.lte("ObservationSG.obs_dt", endDate)

    const { data, error } = await q
    if (error) throw error
    if (!data) return fallbackObservations

    // Mapping to front-end shape
    return data.map((row: any) => ({
      speciesCode:  row.species_code,
      comName:      row.SGBird?.com_name ?? "",
      sciName:      row.SGBird?.sci_name ?? "",
      locId:        row.ObservationSG?.location_id ?? "",
      locName:      row.ObservationSG?.location_name ?? "",
      obsDt:        row.ObservationSG?.obs_dt ?? "",
      obsTime:      undefined,
      howMany:      row.how_many ?? undefined,
      lat:          row.ObservationSG?.lat,
      lng:          row.ObservationSG?.lng,
      obsValid:     row.ObservationSG?.obs_valid ?? true,
      obsReviewed:  row.ObservationSG?.obs_reviewed ?? false,
      locationPrivate: false,
      userDisplayName: row.ObservationSG?.user_display_name ?? "",
    })) as BirdObservation[]
  } catch (err) {
    console.error("Supabase query failed:", err)
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
export async function fetchSpeciesInSingapore(): Promise<
  { code: string; comName: string; sciName: string }[]
> {
  try {
    const { data, error } = await supabase
      .from("SGBird")
      .select("species_code, com_name, sci_name")
      .order("com_name")

    if (error) throw error
    if (!data) return fallbackSpecies

    return data.map((d) => ({
      code: d.species_code,
      comName: d.com_name,
      sciName: d.sci_name,
    }))
  } catch (err) {
    console.error("Supabase query failed:", err)
    return fallbackSpecies
  }
}