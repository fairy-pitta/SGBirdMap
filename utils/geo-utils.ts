import * as turf from "@turf/turf"
import type { Feature, MultiPolygon } from "geojson"

let SG_POLY_CACHE: Feature<MultiPolygon> | null = null

async function loadBoundary(): Promise<Feature<MultiPolygon>> {
  if (SG_POLY_CACHE) return SG_POLY_CACHE
  const res = await fetch("/data/singapore-boundary.geojson") 
  SG_POLY_CACHE = (await res.json()) as Feature<MultiPolygon>
  return SG_POLY_CACHE
}

export function isInsideBoundary(lat: number, lng: number): boolean {
  if (!SG_POLY_CACHE) { void loadBoundary(); return true }
  return turf.booleanPointInPolygon(turf.point([lng, lat]), SG_POLY_CACHE)
}