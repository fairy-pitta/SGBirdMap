"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Eye } from "lucide-react"
import { format } from "date-fns"
import { timeValueToString } from "@/lib/utils"
import type { TimeControlProps } from "@/types/app-types"

export default function TimeControlMobile({
  timeValue,
  setTimeValue,
  isPlaying,
  togglePlay,
  showAll,
  toggleShowAll,
  startDate,
  endDate,
  isLongTermView,
  currentViewDate,
  disabled = false,
}: TimeControlProps) {
  // 適切な時間表示を取得
  const getTimeDisplay = () => {
    if (showAll) {
      return `All Period`
    } else if (isLongTermView) {
      return format(currentViewDate, "yyyy/MM/dd")
    } else {
      return timeValueToString(timeValue[0])
    }
  }

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-white h-9 w-9"
            onClick={togglePlay}
            disabled={showAll || disabled}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            className={`${showAll ? "bg-slate-700" : "bg-white"} h-9`}
            onClick={toggleShowAll}
            disabled={disabled}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showAll ? "Showing All" : "Show All"}
          </Button>
        </div>
        <span className="text-sm font-medium">{getTimeDisplay()}</span>
      </div>

      <div className="space-y-1">
        <Slider value={timeValue} onValueChange={setTimeValue} max={100} step={1} disabled={showAll || disabled} />

        <div className="flex justify-between text-xs text-slate-500">
          {isLongTermView ? (
            // 長期間表示の場合は日付範囲を表示（簡略化）
            <>
              <span>{format(startDate, "MM/dd")}</span>
              <span>{format(endDate, "MM/dd")}</span>
            </>
          ) : (
            // 短期間表示の場合は時間を表示（簡略化）
            <>
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
