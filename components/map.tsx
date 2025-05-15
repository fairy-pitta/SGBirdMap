"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

declare module "leaflet" { interface MapOptions { tap?: boolean } }

import type { BirdObservation } from "@/types/birds"
import type { MapProps, FilterResult } from "@/types/app-types"

import HeatmapLayer           from "./heatmap-layer"
import MapInfo                from "./map-info"
import { useMapFilter }       from "@/hooks/use-map-filter"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useMapMarkers }      from "@/hooks/use-map-markers"

import {
  SINGAPORE_CENTER,
  DEFAULT_ZOOM,
  ANIMATION_CSS,
} from "@/constants/map-constants"

export default function MapComponent({
  observations,
  onRefresh,
  selectedSpecies,
  timeValue,
  startDate,
  endDate,
  showAll,
  showHeatmap,
  isPlaying,
  isLongTermView,
  currentViewDate,
}: MapProps) {

  const [filteredObservations, setFiltered] = useState<BirdObservation[]>([])
  const [newObservations,      setNew]      = useState<BirdObservation[]>([])

  const mapRef         = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const maskLayerRef   = useRef<L.Layer | null>(null)   // ★ マスク保持

  const { filterObservations } = useMapFilter()
  const { isMobile }           = useMobileDetection()
  const { createActiveMarker } = useMapMarkers(isMobile)

  /* ---------- Leaflet 基本セットアップ ---------- */
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl     :"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl   :"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }, [])

  useEffect(() => {
    const st = document.createElement("style")
    st.textContent = ANIMATION_CSS
    document.head.appendChild(st)
    return () => {
      document.head.removeChild(st)
    }
  }, [])

  /* ---------- 地図初期化 ---------- */
  useEffect(() => {
    if (mapRef.current) return

    const m = L.map("map", {
      center: SINGAPORE_CENTER,
      zoom: isMobile ? DEFAULT_ZOOM - 1 : DEFAULT_ZOOM,
      preferCanvas: true,
      zoomControl: !isMobile,
      tap: true,
      dragging: !isMobile,
    })

    /* pane 追加 */
    m.createPane("maskPane")!.style.zIndex = "200"
    m.createPane("heatPane")!.style.zIndex = "400"

    /* ベースタイル */
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(m)

    /* ★ 青マスク：最初は追加せず保持だけ */
    fetch("/data/singapore-boundary.geojson").then(r=>r.json()).then(gj=>{
      maskLayerRef.current = L.geoJSON(gj,{
        pane : "maskPane",
        style:{ color:"#0033ff", weight:0, fillColor:"#0033ff", fillOpacity:0.25 },
      })
    })

    /* マーカー用レイヤ */
    markerLayerRef.current = L.layerGroup(undefined,{pane:"heatPane"}).addTo(m)
    mapRef.current = m
  }, [isMobile])

  /* ---------- マスク表示の ON/OFF ---------- */
  useEffect(()=>{
    if(!mapRef.current || !maskLayerRef.current) return
    const map = mapRef.current
    const mask = maskLayerRef.current
    if(showHeatmap){
      if(!map.hasLayer(mask)) mask.addTo(map)
    }else{
      if(map.hasLayer(mask)) map.removeLayer(mask)
    }
  },[showHeatmap])

  /* ---------- フィルタ結果 ---------- */
  const filterResult: FilterResult = useMemo(
    () => filterObservations(
          observations, selectedSpecies, timeValue,
          startDate, endDate, showAll,
          isLongTermView, currentViewDate),
    [observations, selectedSpecies, timeValue,
     startDate, endDate, showAll,
     isLongTermView, currentViewDate, filterObservations]
  )

  /* ---------- マーカー描画 ---------- */
  const drawMarkers = useCallback((res: FilterResult) => {
    if (showHeatmap) return          // ★ ヒートマップ中は描画しない
    if (!mapRef.current || !markerLayerRef.current) return
    const layer = markerLayerRef.current
    layer.clearLayers()

    if (showAll) {
      res.filtered.forEach(o => createActiveMarker(o).mainCircle.addTo(layer))
      return
    }
    if (isPlaying) {
      res.newObservations.forEach(o => {
        const { pulseMarker } = createActiveMarker(o)
        pulseMarker.addTo(mapRef.current!)
        setTimeout(() => mapRef.current!.removeLayer(pulseMarker), 6000)
      })
    }
  }, [showAll, isPlaying, showHeatmap, createActiveMarker])

  /* ---------- marker 更新 ---------- */
  useEffect(()=>{
    if(!mapRef.current) return
    drawMarkers(filterResult)
    setFiltered(filterResult.filtered)
    setNew(filterResult.newObservations)
  },[filterResult, drawMarkers])

  /* ---------- ヒートマップ対象期間 ---------- */
  const heatmapDateRange = useMemo(()=>{
    if(!showHeatmap) return {start:"",end:""}       // 使われない
    if(showAll){                                    // 全期間統合
      return { start:startDate.toISOString(), end:endDate.toISOString() }
    }
    if(isLongTermView){                             // 日単位
      const d=currentViewDate
      return {
        start:new Date(d.setHours(0,0,0,0)).toISOString(),
        end  :new Date(d.setHours(23,59,59,999)).toISOString(),
      }
    }
    /* スライダー：10 分幅 (timeValue は 0–100 想定) */
    const base = new Date(startDate.getTime()+timeValue*600_000)
    return {
      start:base.toISOString(),
      end  :new Date(base.getTime()+10*60*1000).toISOString(),
    }
  },[showHeatmap,showAll,isLongTermView,currentViewDate,startDate,endDate,timeValue])

  /* ---------- render ---------- */
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
      <div id="map" className="flex-1"/>

      {/* ★ ヒートマップレイヤ */}
      <HeatmapLayer
        map={mapRef.current}
        observations={observations}
        selectedSpecies={selectedSpecies}
        dateRange={heatmapDateRange}
        isVisible={showHeatmap}
        showAll={showAll}
      />
    </div>
  )
}