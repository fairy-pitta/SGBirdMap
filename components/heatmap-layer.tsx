"use client"

import { useEffect, useRef, useMemo } from "react"
import L from "leaflet"
import "leaflet.heat"

import type { BirdObservation } from "@/types/birds"
import { isInsideBoundary } from "@/utils/geo-utils"
import { HEAT_LAYER_OPTIONS } from "@/constants/map-constants"

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
  const heatLayerRef = useRef<L.Layer | null>(null)

  /* ① 期間 + 境界 + 種フィルタ */
  const pool = useMemo(()=>{
    if(!dateRange.start) return []  // showHeatmap=false のダミー
    const startMs=new Date(dateRange.start).getTime()
    const endMs  =new Date(dateRange.end ).getTime()

    return observations.filter(o=>{
      if(selectedSpecies && o.speciesCode!==selectedSpecies) return false
      const t=new Date(o.obsDt).getTime()
      if(t<startMs || t>endMs) return false
      return isInsideBoundary(o.lat,o.lng)
    })
  },[observations,selectedSpecies,dateRange])

  /* ② 重み付け（さらに高感度：0.4 乗 +3） */
  const heatPoints = useMemo<[number,number,number][]>(()=>{
    const m=new Map<string,number>()
    pool.forEach(o=>{
      const key=`${o.lat.toFixed(5)},${o.lng.toFixed(5)}`
      m.set(key,(m.get(key)||0)+(o.howMany??1))
    })
    const pts:[number,number,number][]=[]
    m.forEach((w,key)=>{
      const [lat,lng]=key.split(",").map(Number)
      pts.push([lat,lng,Math.pow(w,0.4)+3])
    })
    return pts
  },[pool])

  /* ③ レイヤ生成 / 更新 */
  useEffect(()=>{
    if(!map) return
    if(heatLayerRef.current){
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current=null
    }
    if(!isVisible || heatPoints.length===0) return

    const layer/*:L.Layer*/ = (L as any).heatLayer(heatPoints,{
      ...HEAT_LAYER_OPTIONS,
      pane      :"heatPane",
      minOpacity:0.4,
      gradient :{
        0.0:"#0015ff",
        0.2:"#006dff",
        0.4:"#00e5ff",
        0.6:"#ffff00",
        0.8:"#ff8000",
        1.0:"#ff0000",
      },
    })
    layer.addTo(map)
    heatLayerRef.current=layer
    return ()=>{ if(heatLayerRef.current) map.removeLayer(heatLayerRef.current) }
  },[map,heatPoints,isVisible])

  return null
}