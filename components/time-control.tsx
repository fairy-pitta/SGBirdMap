"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Eye, Flame } from "lucide-react"
import { format } from "date-fns"
import { timeValueToString } from "@/lib/utils"
import type { TimeControlProps } from "@/types/app-types"

export default function TimeControl({
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
  disabled = false,
}: TimeControlProps) {
  const getTimeDisplay = () => {
    if (showAll) {
      return `All Period: ${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
    } else if (isLongTermView) {
      return format(currentViewDate, "yyyy/MM/dd")
    } else {
      return timeValueToString(timeValue[0])
    }
  }

  return (
    <div className="h-24 bg-slate-200 p-3 border-t border-slate-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {/* ▶︎ / ❚❚ */}
          <Button
            variant="outline"
            size="icon"
            className="mr-2 bg-white"
            onClick={togglePlay}
            disabled={showAll || disabled}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Show-All */}
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            className={`mr-2 ${showAll ? "bg-slate-700" : "bg-white"}`}
            onClick={toggleShowAll}
            disabled={disabled}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showAll ? "Showing All" : "Show All"}
          </Button>

          {/* Heatmap */}
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            className={`mr-2 ${showHeatmap ? "bg-orange-600 text-white" : "bg-white"}`}
            onClick={toggleShowHeatmap}
            disabled={disabled}
          >
            <Flame className="h-4 w-4 mr-1" />
            {showHeatmap ? "Heatmap On" : "Show Heatmap"}
          </Button>

          <span className="text-sm font-medium">{getTimeDisplay()}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <Slider
          value={timeValue}
          onValueChange={setTimeValue}
          max={100}
          step={1}
          disabled={showAll || disabled}
        />
        <div className="flex justify-between text-xs text-slate-500">
          {isLongTermView ? (
            <>
              <span>{format(startDate, "yyyy/MM/dd")}</span>
              <span>{format(new Date((startDate.getTime() + endDate.getTime()) / 2), "yyyy/MM/dd")}</span>
              <span>{format(endDate, "yyyy/MM/dd")}</span>
            </>
          ) : (
            <>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}