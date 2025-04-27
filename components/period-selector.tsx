"use client"

import { useState, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PeriodSelectorProps } from "@/types/app-types"

export default function PeriodSelector({
  period,
  setPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 年の選択肢を生成（現在から10年前まで）- メモ化
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear - i)
  }, [])

  // 年を選択したときの処理 - useCallback
  const handleYearChange = useCallback(
    (year: string) => {
      const selectedYear = Number.parseInt(year)
      const newStartDate = new Date(selectedYear, 0, 1) // 選択した年の1月1日
      const newEndDate = new Date(selectedYear, 11, 31) // 選択した年の12月31日
      setStartDate(newStartDate)
      setEndDate(newEndDate)
    },
    [setStartDate, setEndDate],
  )

  // 期間の表示テキスト - メモ化
  const periodDisplayText = useMemo(() => {
    if (period === "thisYear") return "This Year"
    if (period === "past3Years") return "Past 3 Years"
    return `${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
  }, [period, startDate, endDate])

  // 期間変更ハンドラ - useCallback
  const handlePeriodChange = useCallback(
    (value: string) => {
      setPeriod(value as any)
    },
    [setPeriod],
  )

  // 開始日変更ハンドラ - useCallback
  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) setStartDate(date)
    },
    [setStartDate],
  )

  // 終了日変更ハンドラ - useCallback
  const handleEndDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) setEndDate(date)
    },
    [setEndDate],
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {periodDisplayText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 z-[2000]" align="start">
        <div className="space-y-4">
          <RadioGroup value={period} onValueChange={handlePeriodChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thisYear" id="thisYear" />
              <Label htmlFor="thisYear">This Year</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="past3Years" id="past3Years" />
              <Label htmlFor="past3Years">Past 3 Years</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="year" id="year" />
              <Label htmlFor="year">Select Year</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">Custom Period</Label>
            </div>
          </RadioGroup>

          {period === "year" && (
            <div className="grid gap-2">
              <Label htmlFor="year-select">Select Year</Label>
              <Select onValueChange={handleYearChange} defaultValue={new Date().getFullYear().toString()}>
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="z-[2001]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {period === "custom" && (
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "yyyy/MM/dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[2001]">
                    <Calendar mode="single" selected={startDate} onSelect={handleStartDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "yyyy/MM/dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[2001]">
                    <Calendar mode="single" selected={endDate} onSelect={handleEndDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
