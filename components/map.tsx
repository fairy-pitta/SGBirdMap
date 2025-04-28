"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// --- Leaflet 型拡張 -------------------------------------------------
declare module "leaflet" {
  interface MapOptions {
    tap?: boolean
  }
}

import type { BirdObservation } from "@/types/birds"
import type { MapProps, FilterResult } from "@/types/app-types"

import MapInfo                    from "./map-info"
import { useMapFilter }           from "@/hooks/use-map-filter"
import { useMobileDetection }     from "@/hooks/use-mobile-detection"
import { useMapMarkers }          from "@/hooks/use-map-markers"
import { createPopupContent }     from "@/utils/popup-utils"

import {
  SINGAPORE_CENTER,
  DEFAULT_ZOOM,
  ANIMATION_CSS,
  PERSISTENT_MARKER_STYLE,
} from "@/constants/map-constants"

/* =================================================================== */
/*  Component                                                          */
/* =================================================================== */
export default function MapComponent({
  observations,
  onRefresh,
  selectedSpecies,
  timeValue,
  startDate,
  endDate,
  showAll,
  isPlaying,          // ← 再生状態を受け取る
  isLongTermView,
  currentViewDate,
}: MapProps) {
  /* ------------------------------- state / refs -------------------- */
  const [filteredObservations, setFilteredObservations] = useState<BirdObservation[]>([])
  const [newObservations,      setNewObservations]      = useState<BirdObservation[]>([])

  const mapRef             = useRef<L.Map | null>(null)
  const activeLayerRef     = useRef<L.LayerGroup | null>(null)
  const persistentLayerRef = useRef<L.LayerGroup | null>(null)

  const { filterObservations } = useMapFilter()
  const { isMobile }           = useMobileDetection()
  const { createActiveMarker } = useMapMarkers(isMobile)

  /* ------------------------------- fetch trigger ------------------- */
  const prevSpeciesRef = useRef<string | null>(null)
  const prevStartRef   = useRef<string>("")
  const prevEndRef     = useRef<string>("")

  useEffect(() => {
    const s = startDate.toISOString().slice(0, 10)
    const e = endDate.toISOString().slice(0, 10)

    if (
      selectedSpecies !== prevSpeciesRef.current ||
      s !== prevStartRef.current          ||
      e !== prevEndRef.current
    ) {
      onRefresh?.(selectedSpecies ?? undefined, s, e)
      prevSpeciesRef.current = selectedSpecies
      prevStartRef.current   = s
      prevEndRef.current     = e
    }
  }, [selectedSpecies, startDate, endDate, onRefresh])

  /* ------------------------------- filtering ----------------------- */
  const filterResult: FilterResult = useMemo(
    () =>
      filterObservations(
        observations,
        selectedSpecies,
        timeValue,
        startDate,
        endDate,
        showAll,
        isLongTermView,
        currentViewDate,
      ),
    [
      observations,
      selectedSpecies,
      timeValue,
      startDate,
      endDate,
      showAll,
      isLongTermView,
      currentViewDate,
      filterObservations,
    ],
  )

  /* ------------------------------- one-time setup ------------------ */
  /* leaflet icon fix */
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }, [])

  /* inject animation CSS once */
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = ANIMATION_CSS
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  /* map init */
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map("map", {
      center: SINGAPORE_CENTER,
      zoom: isMobile ? DEFAULT_ZOOM - 1 : DEFAULT_ZOOM,
      preferCanvas: true,
      zoomControl: !isMobile,
      tap: true,
      dragging: !isMobile,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    activeLayerRef.current     = L.layerGroup().addTo(map)
    persistentLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current             = map
  }, [isMobile])

  /* ------------------------------- helpers ------------------------- */
  /* （pulse 用の円は現状使わないが残しておくならここ） */
  const createPersistentMarker = useCallback(
    (obs: BirdObservation) =>
      L.circleMarker([obs.lat, obs.lng], {
        ...PERSISTENT_MARKER_STYLE,
        radius: isMobile ? PERSISTENT_MARKER_STYLE.radius * 1.5 : PERSISTENT_MARKER_STYLE.radius,
        className: "observation-marker pulse-circle",
      }).bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset : isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      }),
    [isMobile],
  )

  /* ------------------------------- draw ---------------------------- */
  const drawMarkers = useCallback(
    (result: FilterResult) => {
      if (!activeLayerRef.current) return
      const layer = activeLayerRef.current
      layer.clearLayers()

      if (showAll) {
        // showAll = true → filtered 全部
        result.filtered.forEach(obs => createActiveMarker(obs).addTo(layer))
      } else if (isPlaying) {
        // 再生中 (showAll=false) → newObservations のみ
        result.newObservations.forEach(obs => createActiveMarker(obs).addTo(layer))
      }
      /* showAll=false & isPlaying=false → 何も描画しない */
    },
    [createActiveMarker, showAll, isPlaying],
  )

  /* ------------------------------- main effect --------------------- */
  useEffect(() => {
    if (!mapRef.current) return
    if (filterResult.filtered.length === 0 && filterResult.newObservations.length === 0) {
      setFilteredObservations([])
      setNewObservations([])
      drawMarkers(filterResult)          // クリアだけ
      return
    }

    /* 先に描画 → state 更新 */
    drawMarkers(filterResult)

    const deepEqual = (a: BirdObservation[], b: BirdObservation[]) =>
      a.length === b.length &&
      a.every((x, i) =>
        x.lat === b[i].lat &&
        x.lng === b[i].lng &&
        x.obsDt === b[i].obsDt &&
        x.speciesCode === b[i].speciesCode)

    if (!deepEqual(filteredObservations, filterResult.filtered))
      setFilteredObservations(filterResult.filtered)

    if (!deepEqual(newObservations, filterResult.newObservations))
      setNewObservations(filterResult.newObservations)
  }, [filterResult, drawMarkers])   // drawMarkers includes isPlaying/showAll deps

  /* ------------------------------- render -------------------------- */
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