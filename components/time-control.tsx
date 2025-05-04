"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Eye, Flame } from "lucide-react"
import { format, eachDayOfInterval } from "date-fns"
import type { TimeControlProps } from "@/types/app-types"
import HeatmapLegend from "@/components/heatmap-legend"

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
  currentViewDate,
  disabled = false,
}: TimeControlProps) {

  const getTimeDisplay = () => {
    if (showAll) {
      return `All Period: ${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
    } else {
      const totalDuration = endDate.getTime() - startDate.getTime()
      const currentTime = new Date(startDate.getTime() + (timeValue[0] / 100) * totalDuration)
      return format(currentTime, "yyyy/MM/dd")
    }
  }

  const getDateLabels = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const interval = Math.ceil(days.length / 5) || 1
    return days.filter((_, idx) => idx % interval === 0 || idx === days.length - 1)
  }

  return (
    <div className="h-24 bg-slate-200 p-3 border-t border-slate-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="mr-2 bg-white"
            onClick={togglePlay}
            disabled={showAll || disabled}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

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

          <HeatmapLegend show={showHeatmap} />
        </div>
      </div>

      {/* Slider + Labels */}
      <div className="space-y-1">
        <Slider
          value={timeValue}
          onValueChange={setTimeValue}
          max={100}
          step={1}
          disabled={showAll || disabled}
        />
        <div className="flex justify-between text-xs text-slate-500">
          {getDateLabels().map((d, i) => (
            <span key={i}>{format(d, "yyyy/MM/dd")}</span>
          ))}
        </div>
      </div>
    </div>
  )
}