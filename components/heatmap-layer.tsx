"use client"
import { useEffect, useRef, useMemo } from "react"
import L from "leaflet"
import "leaflet.heat"

import type { BirdObservation } from "@/types/birds"
import { isInsideBoundary } from "@/utils/geo-utils"

/* ────── ヘルパ ───────────────────────────── */
const dateStr = (d: Date | string) =>
  typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10)

const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 86_400_000) // 1 day = 86,400,000 ms

/* ────── Props ────────────────────────────── */
export interface HeatmapLayerProps {
  map: L.Map | null
  observations: BirdObservation[]
  selectedSpecies: string | null
  showAll: boolean
  /** MapComponent で計算したウィンドウ（日付文字列） */
  dateRange: { start: string; end: string }
  isVisible: boolean
}

/* ────── Component ───────────────────────── */
export default function HeatmapLayer({
  map,
  observations,
  selectedSpecies,
  showAll,
  dateRange,
  isVisible,
}: HeatmapLayerProps) {
  const heatLayerRef = useRef<L.Layer | null>(null)

  /* ---------- フィルタリング ---------- */
  const pool = useMemo(() => {
    // 1) 種フィルタ
    let data = observations.filter(o =>
      !selectedSpecies || o.speciesCode === selectedSpecies
    )

    // 2) 全期間モードならそのまま
    if (showAll) return data

    // 3) 日付ウィンドウでフィルタ
    const winStart = new Date(dateRange.start)
    const winEnd   = new Date(dateRange.end)

    const inWindow = (o: BirdObservation, s: Date, e: Date) => {
      const d = new Date(o.obsDt)
      d.setHours(0, 0, 0, 0)          // 時刻情報は無いが念のため
      return d >= s && d <= e
    }

    const collect = (radiusDays: number) => {
      const s = addDays(winStart, -radiusDays)
      const e = addDays(winEnd,   radiusDays)
      return data.filter(o => inWindow(o, s, e))
    }

    // 最小：指定ウィンドウそのまま
    let result = collect(0)

    // 件数が少なければ順に拡大
    if (result.length < 50) result = collect(7)
    if (result.length < 50) result = collect(30)
    if (result.length < 50) result = collect(90)
    if (result.length < 50) result = collect(180)
    if (result.length < 50) result = collect(365) // 最大 ±1年

    // 4) 境界内
    return result.filter(o => {
      try {
        return isInsideBoundary(o.lat, o.lng)
      } catch {
        return true
      }
    })
  }, [observations, selectedSpecies, showAll, dateRange])

  /* ---------- 重み付け ---------- */
  const heatPoints = useMemo<[number, number, number][]>(() => {
    const m = new Map<string, number>()

    pool.forEach(o => {
      // 約 30 m グリッドで集計
      const key = `${(Math.round(o.lat * 3333) / 3333).toFixed(4)},${(
        Math.round(o.lng * 3333) / 3333
      ).toFixed(4)}`
      m.set(key, (m.get(key) || 0) + (o.howMany ?? 1))
    })

    const pts: [number, number, number][] = []
    m.forEach((w, key) => {
      const [lat, lng] = key.split(",").map(Number)
      // 対数スケールで大きさを緩やかに
      pts.push([lat, lng, Math.log(w + 1) * 4 + 4])
    })
    return pts
  }, [pool])

  /* ---------- レイヤ描画 ---------- */
  useEffect(() => {
    if (!map || !isVisible) return
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    if (heatPoints.length === 0) return

    const z       = map.getZoom()
    const radius  = Math.max(10, 30 - (17 - z) * 4)
    const blur    = Math.max(8, radius * 0.5)
    const maxVal  = Math.max(...heatPoints.map(p => p[2])) || 1

    const layer: L.Layer = (L as any).heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom: 17,
      max: maxVal,
      minOpacity: 0.7,
      gradient: {
        0.0: "#0015ff",
        0.2: "#00bbff",
        0.4: "#ffff00",
        0.6: "#ff8000",
        0.8: "#ff3333",
        1.0: "#990000",
      },
      pane: "heatPane",
    }).addTo(map)

    heatLayerRef.current = layer
    return () => {
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
    }
  }, [map, isVisible, heatPoints])

  return null
}