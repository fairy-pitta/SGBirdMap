"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

declare module "leaflet" { interface MapOptions { tap?: boolean } }

import type { BirdObservation } from "@/types/birds"
import type { MapProps, FilterResult } from "@/types/app-types"

import MapInfo                 from "./map-info"
import { useMapFilter }        from "@/hooks/use-map-filter"
import { useMobileDetection }  from "@/hooks/use-mobile-detection"
import { useMapMarkers }       from "@/hooks/use-map-markers"
import { createPopupContent }  from "@/utils/popup-utils"

import {
  SINGAPORE_CENTER,
  DEFAULT_ZOOM,
  ANIMATION_CSS,
  PERSISTENT_MARKER_STYLE,
} from "@/constants/map-constants"

/* ─────────────────────────────────────────────────────────────── */
export default function MapComponent({
  observations,
  onRefresh,
  selectedSpecies,
  timeValue,
  startDate,
  endDate,
  showAll,
  isPlaying,
  isLongTermView,
  currentViewDate,
}: MapProps) {
  /* ---------- state / refs ------------------------------------- */
  const [filteredObservations, setFiltered] = useState<BirdObservation[]>([])
  const [newObservations,      setNew]      = useState<BirdObservation[]>([])

  const mapRef         = useRef<L.Map | null>(null)
  const activeLayerRef = useRef<L.LayerGroup | null>(null)

  const { filterObservations } = useMapFilter()
  const { isMobile }           = useMobileDetection()
  const { createActiveMarker } = useMapMarkers(isMobile)

  /* ---------- fetch trigger ------------------------------------ */
  const prevInfo = useRef({ sp:null as string|null, s:"", e:"" })
  useEffect(() => {
    const s = startDate.toISOString().slice(0,10)
    const e = endDate  .toISOString().slice(0,10)
    if (selectedSpecies!==prevInfo.current.sp || s!==prevInfo.current.s || e!==prevInfo.current.e) {
      onRefresh?.(selectedSpecies ?? undefined, s, e)
      prevInfo.current = { sp:selectedSpecies, s, e }
    }
  }, [selectedSpecies,startDate,endDate,onRefresh])

  /* ---------- filter result ------------------------------------ */
  const filterResult:FilterResult = useMemo(
    () => filterObservations(
            observations, selectedSpecies, timeValue,
            startDate, endDate, showAll,
            isLongTermView, currentViewDate),
    [observations,selectedSpecies,timeValue,startDate,endDate,
     showAll,isLongTermView,currentViewDate,filterObservations]
  )

  /* ---------- one-time setup ----------------------------------- */
  /* fix Leaflet default icon urls */
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl     :"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl   :"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  },[])

  /* inject pulse/appear keyframes */
  useEffect(() => {
    const style=document.createElement("style");style.textContent=ANIMATION_CSS
    document.head.appendChild(style);return()=>{document.head.removeChild(style)}
  },[])

  /* init map only once */
  useEffect(() => {
    if (mapRef.current) return
    const map=L.map("map",{
      center:SINGAPORE_CENTER,
      zoom:isMobile?DEFAULT_ZOOM-1:DEFAULT_ZOOM,
      preferCanvas:true,zoomControl:!isMobile,tap:true,dragging:!isMobile,
    })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:'&copy; OpenStreetMap',maxZoom:19,
    }).addTo(map)
    activeLayerRef.current=L.layerGroup().addTo(map)
    mapRef.current=map
  },[isMobile])

/* ------------------------------- draw ---------------------------- */
const drawMarkers = useCallback(
  (res: FilterResult) => {
    if (!mapRef.current || !activeLayerRef.current) return
    const map   = mapRef.current
    const layer = activeLayerRef.current
    layer.clearLayers()

    // 1) 全表示モード
    if (showAll) {
      res.filtered.forEach(obs => {
        const { mainCircle } = createActiveMarker(obs)
        mainCircle.addTo(layer)
      })
      return
    }

    // 2) 再生モード ― “その日に初出現” のものだけ
    if (isPlaying) {
      res.newObservations.forEach(obs => {
        const { pulseMarker } = createActiveMarker(obs)
        pulseMarker.addTo(map)    // パルスは独立レイヤー
        setTimeout(() => map.removeLayer(pulseMarker), 6000) // 6 秒後に消す
      })
    }
    // 3) それ以外は何も描かない（layer を既に clear）
  },
  [createActiveMarker, showAll, isPlaying],
)

  /* ---------- main effect -------------------------------------- */
  useEffect(()=>{
    if(!mapRef.current) return
    drawMarkers(filterResult)
    setFiltered (filterResult.filtered)
    setNew      (filterResult.newObservations)
  },[filterResult,drawMarkers])

  /* ---------- render ------------------------------------------- */
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MapInfo
        showAll={showAll}
        isLongTermView={isLongTermView}
        currentViewDate={currentViewDate}
        timeValue={timeValue}
        startDate={startDate}
        endDate={endDate}
        filteredCount={filteredObservations.length}
        newCount={newObservations.length}
      />
      <div id="map" className="flex-1" />
    </div>
  )
}