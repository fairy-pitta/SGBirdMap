/* utils/geo-utils.ts
   ─────────────────────────────────────────── */
   import type { Feature, MultiPolygon } from "geojson"
   import inside from "@turf/boolean-point-in-polygon"
   import { point } from "@turf/helpers"
   
   let SG_POLY_CACHE: Feature<MultiPolygon> | null = null
   let LOAD_ERROR    = false                     // ← 失敗フラグ
   
   /** GeoJSON を lazy‑load */
   export async function loadBoundary(): Promise<Feature<MultiPolygon> | null> {
     if (SG_POLY_CACHE || LOAD_ERROR) return SG_POLY_CACHE
     try {
       const res = await fetch("/data/singapore-boundary.geojson")
       if (!res.ok) throw new Error(`HTTP ${res.status}`)
       SG_POLY_CACHE = (await res.json()) as Feature<MultiPolygon>
     } catch (err) {
       console.error("[Boundary] failed to fetch — heatmap continues without clip", err)
       LOAD_ERROR = true
       SG_POLY_CACHE = null         // 失敗時は null にしておく
     }
     return SG_POLY_CACHE
   }
   
   /** 境界内かどうか。境界取得失敗時は true を返して処理を継続 */
   export function isInsideBoundary(lat: number, lng: number): boolean {
     if (LOAD_ERROR) return true
     if (!SG_POLY_CACHE) {
       // 非同期ロードの途中で呼ばれた場合は true（後続再描画時に正しくクリップ）
       // レイヤ側で再描画を行うので可視化は最終的に一致する
       return true
     }
     return inside(point([lng, lat]), SG_POLY_CACHE)
   }