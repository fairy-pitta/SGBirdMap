"use client"
import { useEffect, useRef, useMemo } from "react"
import L from "leaflet"
import "leaflet.heat"

import type { BirdObservation } from "@/types/birds"
import { isInsideBoundary } from "@/utils/geo-utils"

export interface HeatmapLayerProps {
  map: L.Map | null
  observations: BirdObservation[]
  selectedSpecies: string | null
  dateRange: { start: string; end: string }
  isVisible: boolean
}

export default function HeatmapLayer({
  map,
  observations,
  selectedSpecies,
  dateRange,
  isVisible,
}: HeatmapLayerProps) {
  const heatLayerRef = useRef<any>(null)

  /* ---------- 可変ウィンドウでフィルタ ---------- */
  const pool = useMemo(() => {
    if (!dateRange.start) return []

    const center = (new Date(dateRange.start).getTime() + new Date(dateRange.end).getTime()) / 2
    const oneDay = 86_400_000

    const collect = (radiusDays: number) =>
      observations.filter(o => {
        if (selectedSpecies && o.speciesCode !== selectedSpecies) return false
        const t = new Date(o.obsDt).getTime()
        if (Math.abs(t - center) > radiusDays * oneDay) return false
        return isInsideBoundary(o.lat, o.lng)
      })

    let data = collect(1)
    if (data.length < 20) data = collect(7)
    if (data.length < 5)  data = collect(30)
    return data
  }, [observations, selectedSpecies, dateRange])

  /* ---------- 重み付け ---------- */
  const heatPoints = useMemo<[number, number, number][]>(() => {
    const m = new Map<string, number>()
    pool.forEach(o => {
      const key = `${o.lat.toFixed(4)},${o.lng.toFixed(4)}`
      m.set(key, (m.get(key) || 0) + (o.howMany ?? 1))
    })
    const pts: [number, number, number][] = []
    m.forEach((w, key) => {
      const [lat, lng] = key.split(",").map(Number)
      pts.push([lat, lng, Math.log(w + 1) * 4 + 4])
    })
    return pts
  }, [pool])

  /* ---------- ヒートレイヤーの描画 ---------- */
  useEffect(() => {
    if (!map || !isVisible) return
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    if (heatPoints.length === 0) return

    const z = map.getZoom()
    const radius = Math.max(12, 30 - (17 - z) * 4)
    const blur = Math.max(8, 14 - (17 - z) * 1.5)
    const maxVal = Math.max(...heatPoints.map(p => p[2])) || 1

    const layer = (L as any).heatLayer(heatPoints, {
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
        0.75: "#ff3333",
        0.9: "#ff0000",
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