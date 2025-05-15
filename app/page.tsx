"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { getCachedPreferences } from "@/lib/cache" // 🔧 追加
import Image from "next/image"

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] bg-slate-100 animate-pulse flex items-center justify-center">
      Loading map...
    </div>
  ),
})

export default function Home() {
  /* ------------------ キャッシュ取得 ------------------ */
  const cached = typeof window !== "undefined" ? getCachedPreferences() : null

  /* ------------------ Period ------------------ */
  const {
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLongTermView,
  } = usePeriod()

  useEffect(() => {
    if (cached) {
      try {
        const s = new Date(cached.startDate)
        const e = new Date(cached.endDate)
        setStartDate(s)
        setEndDate(e)
      } catch (e) {
        console.warn("Failed to restore date range from cache", e)
      }
    }
  }, [setStartDate, setEndDate])

  /* ------------------ State ------------------ */
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(
    cached?.speciesCode ?? null
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeValue, setTimeValue] = useState<[number]>([0])
  const [showAll, setShowAll] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date())

  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const accumulatedTimeRef = useRef<number>(0)

  const { isMobile } = useMobileDetection()
  const { observations, refreshData } = useBirdData()

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), [])
  const toggleShowAll = useCallback(() => setShowAll(prev => !prev), [])
  const toggleShowHeatmap = useCallback(() => setShowHeatmap(p => !p), [])

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
      if (animationFrameRef.current !== null)
        cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying])

  /* ------------------ UI ------------------ */
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
          <div className="flex items-center space-x-3">
            <Image
              src="/icons/logo-icon.png"
              width={52}
              height={52}
              alt="Bird and map logo"
              className="shrink-0"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Singapore Bird Observation Map
            </h1>
          </div>
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
            <div className="flex-1 overflow-hidden">
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-slate-100 p-4 overflow-y-auto shadow-md">
              {controlPanel}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
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
              </div>
              {timeControl}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}