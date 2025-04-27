"use client"

import { format } from "date-fns"
import { timeValueToString } from "@/lib/utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

interface MapInfoProps {
  showAll: boolean
  isLongTermView: boolean
  currentViewDate: Date
  timeValue: number
  startDate: Date
  endDate: Date
  filteredCount: number
  newCount: number
}

export default function MapInfo({
  showAll,
  isLongTermView,
  currentViewDate,
  timeValue,
  startDate,
  endDate,
  filteredCount,
  newCount,
}: MapInfoProps) {
  const { isMobile } = useMobileDetection()

  // 適切な時間表示を取得
  const getTimeDisplay = () => {
    if (showAll) {
      return isMobile
        ? `All Period`
        : `All Period: ${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
    } else if (isLongTermView) {
      return format(currentViewDate, "yyyy/MM/dd")
    } else {
      return timeValueToString(timeValue)
    }
  }

  return (
    <div className="p-2 bg-slate-700 text-white text-sm">
      <div className="flex justify-between items-center">
        <div>
          {showAll ? (
            <span>Showing All</span>
          ) : (
            <>
              {isLongTermView ? "Date" : "Time"}: <span className="font-medium">{getTimeDisplay()}</span>
            </>
          )}
        </div>
        <div>
          {isMobile ? (
            <>
              <span className="font-medium">{filteredCount}</span> obs
              {!showAll && (
                <>
                  {" "}
                  (<span className="font-medium">+{newCount}</span>)
                </>
              )}
            </>
          ) : (
            <>
              Showing: <span className="font-medium">{filteredCount}</span> observations
              {!showAll && (
                <>
                  {" | "}New: <span className="font-medium">{newCount}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
