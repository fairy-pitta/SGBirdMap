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
  const { observations, refreshData } = birdData

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
      onGetData={async () => {
        if (selectedSpecies) {
          await refreshData(
            selectedSpecies,
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0]
          )
        }
      }}
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
                onRefresh={refreshData}
                selectedSpecies={selectedSpecies}
                timeValue={timeValue[0]}
                startDate={startDate}
                endDate={endDate}
                showAll={showAll}
                isPlaying={isPlaying}
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
                  isPlaying={isPlaying}
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