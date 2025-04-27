#　デバッグ依頼 
エラーが発生しているので、解明してください

Unhandled Runtime Error


Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.

app/page.tsx (187:17) @ Home


  185 |               <div className="w-72 bg-slate-100 p-4 overflow-y-auto shadow-md">{controlPanel}</div>
  186 |               <div className="flex-1 flex flex-col">
> 187 |                 <MapComponent
      |                 ^
  188 |                   observations={observations}
  189 |                   onRefresh={refreshData}
  190 |                   selectedSpecies={selectedSpecies}



# map.tsx

```
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
```


# use-bird-data.tsx

```
"use client"

import { useState, useCallback } from "react"
import { fetchBirdObservations } from "@/lib/api"
import type { BirdObservation } from "@/types/birds"
import type { FilterResult } from "@/types/app-types"

// キャッシュのインターフェース
interface DataCache {
  [key: string]: {
    data: BirdObservation[]
    timestamp: number
  }
}

// キャッシュの有効期間（ミリ秒）
const CACHE_DURATION = 5 * 60 * 1000 // 5分

/**
 * データソースの種類
 */
export type DataSource = "api"

/**
 * 鳥の観測データを管理するカスタムフック
 */
export function useBirdData() {
  const [observations, setObservations] = useState<BirdObservation[]>([])
  const [filteredObservations, setFilteredObservations] = useState<BirdObservation[]>([])
  const [newObservations, setNewObservations] = useState<BirdObservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dataSource] = useState<DataSource>("api")
  const [error, setError] = useState<string | null>(null)

  // データキャッシュ
  const [cache, setCache] = useState<DataCache>({})

  // キャッシュキーを生成する関数
  const getCacheKey = useCallback((speciesCode?: string, startDate?: string, endDate?: string): string => {
    return `${speciesCode || "all"}_${startDate || ""}_${endDate || ""}`
  }, [])

  // キャッシュからデータを取得する関数
  const getFromCache = useCallback(
    (key: string): BirdObservation[] | null => {
      const cachedData = cache[key]
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.data
      }
      return null
    },
    [cache],
  )

  // キャッシュにデータを保存する関数
  const saveToCache = useCallback((key: string, data: BirdObservation[]) => {
    setCache((prevCache) => ({
      ...prevCache,
      [key]: {
        data,
        timestamp: Date.now(),
      },
    }))
  }, [])

  /**
   * データのリフレッシュ（fetch）
   */
  const refreshData = useCallback(
    async (speciesCode?: string, startDate?: string, endDate?: string) => {
      if (!speciesCode) {
        console.warn("No species selected, skipping fetch.")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const cacheKey = getCacheKey(speciesCode, startDate, endDate)
        const cachedData = getFromCache(cacheKey)

        if (cachedData) {
          console.log("✅ Using cached bird observation data", cachedData)
          setObservations(cachedData)
        } else {
          console.log(`🔄 Fetching bird observations for ${speciesCode} from ${startDate} to ${endDate}`)
          const data = await fetchBirdObservations(speciesCode, startDate, endDate)
          setObservations(data)
          saveToCache(cacheKey, data)
        }
      } catch (error) {
        console.error("Failed to refresh bird observations:", error)
        setError(error instanceof Error ? error.message : "Unknown error refreshing data")
      } finally {
        setIsLoading(false)
      }
    },
    [getCacheKey, getFromCache, saveToCache],
  )

  /**
   * フィルタリング結果の更新
   */
  const updateFilteredData = useCallback((result: FilterResult) => {
    setFilteredObservations(result.filtered)
    setNewObservations(result.newObservations)
  }, [])

  /**
   * キャッシュをクリア
   */
  const clearCache = useCallback(() => {
    setCache({})
  }, [])

  return {
    observations,
    filteredObservations,
    newObservations,
    isLoading,
    dataSource,
    error,
    refreshData,
    updateFilteredData,
    clearCache,
  }
}

export type UseBirdDataReturnType = ReturnType<typeof useBirdData>
```

# app-types.tsx

```
import type { BirdObservation } from "./birds"

// 期間選択のタイプ
export type PeriodType = "thisYear" | "past3Years" | "year" | "custom"

// マップコンポーネントのプロップス
export interface MapProps {
  observations: BirdObservation[]     
  onRefresh: (
    speciesCode?: string,
    startDate?: string,
    endDate?: string
  ) => void                                 
  selectedSpecies: string | null
  timeValue: number
  startDate: Date
  endDate: Date
  showAll: boolean
  isLongTermView: boolean
  currentViewDate: Date
}

// 期間選択コンポーネントのプロップス
export interface PeriodSelectorProps {
  period: PeriodType
  setPeriod: (period: PeriodType) => void
  startDate: Date
  setStartDate: (date: Date) => void
  endDate: Date
  setEndDate: (date: Date) => void
}

// 種選択コンポーネントのプロップス
export interface SpeciesSelectorProps {
  onSelect: (speciesCode: string | null) => void
}

// 時間コントロールコンポーネントのプロップス
export interface TimeControlProps {
  timeValue: number[]
  setTimeValue: (value: number[]) => void
  isPlaying: boolean
  togglePlay: () => void
  showAll: boolean
  toggleShowAll: () => void
  startDate: Date
  endDate: Date
  isLongTermView: boolean
  currentViewDate: Date
  disabled?: boolean
}

// フィルタリング結果
export interface FilterResult {
  filtered: BirdObservation[]
  newObservations: BirdObservation[]
}
```

# page.tsx

```
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { addDays } from "date-fns"
import SimpleFilterPanel from "@/components/filter-panel" 
import TimeControl from "@/components/time-control"
import TimeControlMobile from "@/components/time-control-mobile"
import { usePeriod } from "@/hooks/use-period"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { ANIMATION_SPEED, SLIDER_INCREMENT } from "@/constants/map-constants"
import MobileMenu from "@/components/mobile-menu"
import { useBirdData } from "@/hooks/use-bird-data"

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] bg-slate-100 animate-pulse flex items-center justify-center">
      Loading map...
    </div>
  ),
})

export default function Home() {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeValue, setTimeValue] = useState([0])
  const [showAll, setShowAll] = useState(false)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const accumulatedTimeRef = useRef<number>(0)

  const { period, setPeriod, startDate, setStartDate, endDate, setEndDate, isLongTermView } = usePeriod()
  const { isMobile } = useMobileDetection()

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), [])
  const toggleShowAll = useCallback(() => setShowAll(prev => !prev), [])

  const birdData = useBirdData();
  const { observations } = birdData
  const refreshData = useCallback(
    (speciesCode?: string, startDate?: string, endDate?: string) => {
      if (!speciesCode) return
      birdData.refreshData(speciesCode, startDate, endDate)
    },
    [birdData]
  )

  useEffect(() => {
    if (isLongTermView) {
      const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysToAdd = Math.floor((timeValue[0] / 100) * totalDays)
      setCurrentViewDate(addDays(startDate, daysToAdd))
    }
  }, [timeValue, startDate, endDate, isLongTermView])

  useEffect(() => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)

    if (isPlaying) {
      lastTimestampRef.current = 0
      accumulatedTimeRef.current = 0

      const animate = (timestamp: number) => {
        if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
        const deltaTime = timestamp - lastTimestampRef.current
        lastTimestampRef.current = timestamp

        accumulatedTimeRef.current += deltaTime

        if (accumulatedTimeRef.current >= ANIMATION_SPEED) {
          setTimeValue(prev => {
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
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying])

  const controlPanel = (
    <SimpleFilterPanel
      periodProps={{ period, setPeriod, startDate, setStartDate, endDate, setEndDate }}
      onSpeciesSelect={setSelectedSpecies}
      onGetData={() => {}}  // RefreshはMap側でやる
    />
  )

  const timeControl = isMobile ? (
    <TimeControlMobile
      timeValue={timeValue}
      setTimeValue={setTimeValue}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      showAll={showAll}
      toggleShowAll={toggleShowAll}
      startDate={startDate}
      endDate={endDate}
      isLongTermView={isLongTermView}
      currentViewDate={currentViewDate}
      disabled={false}
    />
  ) : (
    <TimeControl
      timeValue={timeValue}
      setTimeValue={setTimeValue}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      showAll={showAll}
      toggleShowAll={toggleShowAll}
      startDate={startDate}
      endDate={endDate}
      isLongTermView={isLongTermView}
      currentViewDate={currentViewDate}
      disabled={false}
    />
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="h-screen flex flex-col">
        <header className="bg-slate-800 text-white p-3 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            {isMobile ? (
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
                <h1 className="font-bold text-base ml-2">SG Bird Map</h1>
              </div>
            ) : (
              <h1 className="font-bold text-xl">Singapore Bird Observation Map</h1>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {isMobile ? (
            <div className="flex-1 flex flex-col">
              <MapComponent
                observations={observations}
                onRefresh={useCallback(() => {
                  if (selectedSpecies) {
                    refreshData(
                      selectedSpecies,
                      startDate.toISOString().split('T')[0],
                      endDate.toISOString().split('T')[0]
                    )
                  }
                }, [selectedSpecies, startDate, endDate, refreshData])}
                selectedSpecies={selectedSpecies}
                timeValue={timeValue[0]}
                startDate={startDate}
                endDate={endDate}
                showAll={showAll}
                isLongTermView={isLongTermView}
                currentViewDate={currentViewDate}
              />
              {timeControl}
              <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                {controlPanel}
              </MobileMenu>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-72 bg-slate-100 p-4 overflow-y-auto shadow-md">{controlPanel}</div>
              <div className="flex-1 flex flex-col">
                <MapComponent
                  observations={observations}
                  onRefresh={refreshData}
                  selectedSpecies={selectedSpecies}
                  timeValue={timeValue[0]}
                  startDate={startDate}
                  endDate={endDate}
                  showAll={showAll}
                  isLongTermView={isLongTermView}
                  currentViewDate={currentViewDate}
                />
                {timeControl}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
```