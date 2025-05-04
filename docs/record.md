# page.tsx

```
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { addDays } from "date-fns"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

import SimpleFilterPanel from "@/components/filter-panel"
import TimeControl from "@/components/time-control"
import TimeControlMobile from "@/components/time-control-mobile"

import { usePeriod } from "@/hooks/use-period"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useBirdData } from "@/hooks/use-bird-data"

import { ANIMATION_SPEED, SLIDER_INCREMENT } from "@/constants/map-constants"

// 動的 import（SSR 無効）
const MapComponent = dynamic(() => import("@/components/map"), { ssr: false })
const DeckHeatmap = dynamic(() => import("@/components/deck-heatmap"), { ssr: false })

export default function Home() {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeValue, setTimeValue] = useState<[number]>([0])
  const [showAll, setShowAll] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date())

  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const accumulatedTimeRef = useRef<number>(0)

  const {
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLongTermView,
  } = usePeriod()
  const { isMobile } = useMobileDetection()
  const { observations, refreshData } = useBirdData()

  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), [])
  const toggleShowAll = useCallback(() => setShowAll((prev) => !prev), [])
  const toggleShowHeatmap = useCallback(() => setShowHeatmap((p) => !p), [])

  useEffect(() => {
    if (isLongTermView) {
      const totalDays = Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      )
      const daysToAdd = Math.floor((timeValue[0] / 100) * totalDays)
      setCurrentViewDate(addDays(startDate, daysToAdd))
    }
  }, [timeValue, startDate, endDate, isLongTermView])

  useEffect(() => {
    if (animationFrameRef.current !== null)
      cancelAnimationFrame(animationFrameRef.current)

    if (isPlaying) {
      lastTimestampRef.current = 0
      accumulatedTimeRef.current = 0

      const animate = (timestamp: number) => {
        if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
        const deltaTime = timestamp - lastTimestampRef.current
        lastTimestampRef.current = timestamp

        accumulatedTimeRef.current += deltaTime

        if (accumulatedTimeRef.current >= ANIMATION_SPEED) {
          setTimeValue((prev) => {
            const newValue = prev[0] + SLIDER_INCREMENT
            if (newValue > 100) {
              setIsPlaying(false)
              return [0]
            }
            return [newValue]
          })
          accumulatedTimeRef.current = 0
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current !== null)
        cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying])

  const controlPanel = (
    <SimpleFilterPanel
      periodProps={{ period, setPeriod, startDate, setStartDate, endDate, setEndDate }}
      onSpeciesSelect={setSelectedSpecies}
      onGetData={async () => {
        if (selectedSpecies) {
          await refreshData(
            selectedSpecies,
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          )
        }
      }}
    />
  )

  const timeControlCommonProps = {
    timeValue,
    setTimeValue,
    isPlaying,
    togglePlay,
    showAll,
    toggleShowAll,
    showHeatmap,
    toggleShowHeatmap,
    startDate,
    endDate,
    isLongTermView,
    currentViewDate,
    disabled: false,
  }

  const dateRange = useMemo(() => ({
    start: startDate.toISOString(),
    end: endDate.toISOString()
  }), [startDate, endDate])

  const timeControl = isMobile ? (
    <TimeControlMobile {...timeControlCommonProps} />
  ) : (
    <TimeControl {...timeControlCommonProps} />
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="h-screen flex flex-col">
        <header className="bg-slate-800 text-white p-3 shadow-md">
          <div className="mx-auto flex justify-between items-center">
            <h1 className="font-bold text-xl">Singapore Bird Observation Map</h1>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {isMobile ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 space-y-3 bg-slate-100 shadow-md">
              {controlPanel}
              {timeControl}
            </div>
            <div className="flex-1 overflow-hidden relative">
              {showHeatmap ? (
                <DeckHeatmap
                  observations={observations}
                  selectedSpecies={selectedSpecies}
                  dateRange={dateRange}
                />
              ) : (
                <MapComponent
                  observations={observations}
                  onRefresh={refreshData}
                  selectedSpecies={selectedSpecies}
                  timeValue={timeValue[0]}
                  startDate={startDate}
                  endDate={endDate}
                  showAll={showAll}
                  isPlaying={isPlaying}
                  isLongTermView={isLongTermView}
                  currentViewDate={currentViewDate}
                  showHeatmap={showHeatmap}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-slate-100 p-4 overflow-y-auto shadow-md">
              {controlPanel}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden relative">
              {showHeatmap ? (
                <DeckHeatmap
                  observations={observations}
                  selectedSpecies={selectedSpecies}
                  startDate={startDate}
                  endDate={endDate}
                  showAll={showAll}
                  currentViewDate={currentViewDate}
                  isLongTermView={isLongTermView}
                  timeValue={timeValue[0]}
                />
              ) : (
                <MapComponent
                  observations={observations}
                  onRefresh={refreshData}
                  selectedSpecies={selectedSpecies}
                  timeValue={timeValue[0]}
                  startDate={startDate}
                  endDate={endDate}
                  showAll={showAll}
                  isPlaying={isPlaying}
                  isLongTermView={isLongTermView}
                  currentViewDate={currentViewDate}
                  showHeatmap={showHeatmap}
                />
              )}
              </div>
              {timeControl}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```


# map.tsx

```
"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import type { BirdObservation } from "@/types/birds"
import type { MapProps, FilterResult } from "@/types/app-types"

import HeatmapLayer from "./heatmap-layer"
import MapInfo from "./map-info"
import { useMapFilter } from "@/hooks/use-map-filter"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useMapMarkers } from "@/hooks/use-map-markers"

import {
  SINGAPORE_CENTER,
  DEFAULT_ZOOM,
  ANIMATION_CSS,
} from "@/constants/map-constants"

import DeckHeatmap from "./deck-heatmap"

declare module "leaflet" {
  interface MapOptions {
    tap?: boolean
  }
}

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
  const [newObservations, setNew] = useState<BirdObservation[]>([])

  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const maskLayerRef = useRef<L.Layer | null>(null)

  const { filterObservations } = useMapFilter()
  const { isMobile } = useMobileDetection()
  const { createActiveMarker } = useMapMarkers(isMobile)

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }, [])

  useEffect(() => {
    const st = document.createElement("style")
    st.textContent = ANIMATION_CSS
    document.head.appendChild(st)
    return () => document.head.removeChild(st)
  }, [])

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

    m.createPane("maskPane")!.style.zIndex = "200"
    m.createPane("heatPane")!.style.zIndex = "400"

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(m)

    fetch("/data/singapore-boundary.geojson")
      .then(r => r.json())
      .then(gj => {
        maskLayerRef.current = L.geoJSON(gj, {
          pane: "maskPane",
          style: { color: "#0033ff", weight: 0, fillColor: "#0033ff", fillOpacity: 0.25 },
        })
      })

    markerLayerRef.current = L.layerGroup(undefined, { pane: "heatPane" }).addTo(m)
    mapRef.current = m
  }, [isMobile])

  useEffect(() => {
    if (!mapRef.current || !maskLayerRef.current) return
    const map = mapRef.current
    const mask = maskLayerRef.current
    if (showHeatmap) {
      if (!map.hasLayer(mask)) mask.addTo(map)
    } else {
      if (map.hasLayer(mask)) map.removeLayer(mask)
    }
  }, [showHeatmap])

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
        currentViewDate
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
    ]
  )

  const drawMarkers = useCallback(
    (res: FilterResult) => {
      if (showHeatmap) return
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
    },
    [showAll, isPlaying, showHeatmap, createActiveMarker]
  )

  useEffect(() => {
    if (!mapRef.current) return
    drawMarkers(filterResult)
    setFiltered(filterResult.filtered)
    setNew(filterResult.newObservations)
  }, [filterResult, drawMarkers])

  const heatmapDateRange = useMemo(() => {
    if (!showHeatmap) return { start: "", end: "" }
    if (showAll) {
      return { start: startDate.toISOString(), end: endDate.toISOString() }
    }
    if (isLongTermView) {
      const d = currentViewDate
      return {
        start: new Date(d.setHours(0, 0, 0, 0)).toISOString(),
        end: new Date(d.setHours(23, 59, 59, 999)).toISOString(),
      }
    }
    const base = new Date(startDate.getTime() + timeValue * 600_000)
    return {
      start: base.toISOString(),
      end: new Date(base.getTime() + 10 * 60 * 1000).toISOString(),
    }
  }, [showHeatmap, showAll, isLongTermView, currentViewDate, startDate, endDate, timeValue])

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
      <div className="flex-1 overflow-hidden relative">
        <div id="map" className="absolute inset-0" />
        {showHeatmap && (
          <DeckHeatmap
            observations={observations}
            selectedSpecies={selectedSpecies}
            startDate={startDate}
            endDate={endDate}
            timeValue={timeValue}
            showAll={showAll}
            isLongTermView={isLongTermView}
            currentViewDate={currentViewDate}
          />
        )}
      </div>
      {!showHeatmap && (
        <HeatmapLayer
          map={mapRef.current}
          observations={observations}
          selectedSpecies={selectedSpecies}
          dateRange={heatmapDateRange}
          isVisible={showHeatmap}
          showAll={showAll}
        />
      )}
    </div>
  )
}

```


# 
