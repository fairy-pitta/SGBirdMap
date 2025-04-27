"use client"

import { useState, useEffect } from "react"
import { subYears, differenceInDays } from "date-fns"
import type { PeriodType } from "@/types/app-types"
import { LONG_TERM_THRESHOLD } from "@/constants/map-constants"

// 期間選択を管理するカスタムフック
export function usePeriod() {
  const [period, setPeriod] = useState<PeriodType>("thisYear")
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1)) // 今年の1月1日
  const [endDate, setEndDate] = useState<Date>(new Date())

  // 長期間表示かどうかを判定
  const isLongTermView = differenceInDays(endDate, startDate) > LONG_TERM_THRESHOLD

  // 期間変更時の処理
  useEffect(() => {
    if (period === "thisYear") {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      setStartDate(startOfYear)
      setEndDate(now)
    } else if (period === "past3Years") {
      setStartDate(subYears(new Date(), 3))
      setEndDate(new Date())
    }
    // year と custom の場合は、別途日付が設定されるため処理しない
  }, [period])

  // 年を選択した時の処理
  const handleYearChange = (year: string) => {
    const selectedYear = Number.parseInt(year)
    const newStartDate = new Date(selectedYear, 0, 1) // 選択した年の1月1日
    const newEndDate = new Date(selectedYear, 11, 31) // 選択した年の12月31日
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  return {
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLongTermView,
    handleYearChange,
  }
}
