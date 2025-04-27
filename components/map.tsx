"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Leafletの型拡張
declare module "leaflet" {
  interface MapOptions {
    tap?: boolean
  }
}
import type { BirdObservation } from "@/types/birds"
import MapInfo from "./map-info"
import { useMapFilter } from "@/hooks/use-map-filter"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import type { MapProps, FilterResult } from "@/types/app-types"
import { SINGAPORE_CENTER, DEFAULT_ZOOM, ANIMATION_CSS } from "@/constants/map-constants"
import { PERSISTENT_MARKER_STYLE } from "@/constants/marker-constants"
import { createPopupContent } from "@/utils/popup-utils"
import { useMapMarkers } from "@/hooks/use-map-markers"

export default function MapComponent({
  observations,
  onRefresh,
  selectedSpecies,
  timeValue,
  startDate,
  endDate,
  showAll,
  isLongTermView,
  currentViewDate,
}: MapProps) {
  const [filteredObservations, setFilteredObservations] = useState<BirdObservation[]>([])
  const [newObservations, setNewObservations] = useState<BirdObservation[]>([])

  const mapRef = useRef<L.Map | null>(null)
  const activeLayerRef = useRef<L.LayerGroup | null>(null)
  const persistentLayerRef = useRef<L.LayerGroup | null>(null)

  const { filterObservations } = useMapFilter()
  const { isMobile } = useMobileDetection()
  const { createActiveMarker } = useMapMarkers(isMobile)

  const prevSpeciesRef = useRef<string | null>(null)
  const prevStartRef = useRef<string>("")
  const prevEndRef = useRef<string>("")

  useEffect(() => {
    const s = startDate.toISOString().slice(0,10)
    const e = endDate.toISOString().slice(0,10)
    
    if (
      selectedSpecies !== prevSpeciesRef.current ||
      s !== prevStartRef.current ||
      e !== prevEndRef.current
    ) {
      onRefresh?.(selectedSpecies ?? undefined, s, e)
      prevSpeciesRef.current = selectedSpecies
      prevStartRef.current = s
      prevEndRef.current = e
    }
  }, [selectedSpecies, startDate, endDate, onRefresh])

  const filterResult: FilterResult = useMemo(() => {
    return filterObservations(
      observations,
      selectedSpecies,
      timeValue,
      startDate,
      endDate,
      showAll,
      isLongTermView,
      currentViewDate
    )
  }, [
    observations,
    selectedSpecies,
    timeValue,
    startDate,
    endDate,
    showAll,
    isLongTermView,
    currentViewDate,
    filterObservations,
  ])

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

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = ANIMATION_CSS
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    activeLayerRef.current = L.layerGroup().addTo(map)
    persistentLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
  }, [isMobile])

  const createPersistentMarker = useCallback(
    (obs: BirdObservation) =>
      L.circleMarker([obs.lat, obs.lng], {
        ...PERSISTENT_MARKER_STYLE,
        radius: isMobile
          ? PERSISTENT_MARKER_STYLE.radius * 1.5
          : PERSISTENT_MARKER_STYLE.radius,
      }).bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      }),
    [isMobile],
  )

  const drawMarkers = useCallback(
    (result: FilterResult) => {
      if (!activeLayerRef.current || !persistentLayerRef.current) return

      activeLayerRef.current.clearLayers()

      if (!showAll) {
        filteredObservations.forEach((obs) => {
          const isStillActive = result.newObservations.some(
            (n) =>
              n.lat === obs.lat &&
              n.lng === obs.lng &&
              n.obsDt === obs.obsDt &&
              n.speciesCode === obs.speciesCode,
          )
          if (!isStillActive && persistentLayerRef.current) {
            createPersistentMarker(obs).addTo(persistentLayerRef.current)
          }
        })
      }

      result.filtered.forEach((obs) => {
        createActiveMarker(obs).addTo(activeLayerRef.current!)
        createPersistentMarker(obs).addTo(persistentLayerRef.current!)
      })
    },
    [createPersistentMarker, createActiveMarker, showAll],
  )

  useEffect(() => {
    if (!mapRef.current) return
    if (filterResult.filtered.length === 0 && filterResult.newObservations.length === 0) {
      setFilteredObservations([])
      setNewObservations([])
      return
    }

    const deepEqual = (a: BirdObservation[], b: BirdObservation[]) => {
      if (a.length !== b.length) return false
      return a.every((obsA, i) => {
        const obsB = b[i]
        return (
          obsA.lat === obsB.lat &&
          obsA.lng === obsB.lng &&
          obsA.obsDt === obsB.obsDt &&
          obsA.speciesCode === obsB.speciesCode
        )
      })
    }

    if (!deepEqual(filteredObservations, filterResult.filtered)) {
      setFilteredObservations(filterResult.filtered)
    }
    if (!deepEqual(newObservations, filterResult.newObservations)) {
      setNewObservations(filterResult.newObservations)
    }

    drawMarkers(filterResult)
  }, [filterResult, drawMarkers])

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