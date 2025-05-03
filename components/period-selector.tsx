"use client"

import { useState, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export interface PeriodSelectorProps {
  period: string
  setPeriod: (period: string) => void
  startDate: Date
  setStartDate: (date: Date) => void
  endDate: Date
  setEndDate: (date: Date) => void
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function PeriodSelector({
  period,
  setPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"calendar" | "yearSelect" | "monthSelect">("calendar")
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(startDate))
  const [datePickerFor, setDatePickerFor] = useState<"start" | "end">("start")
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear - i)
  }, [])

  const calendarYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1999 }, (_, i) => 2000 + i)
  }, [])

  const periodDisplayText = useMemo(() => {
    if (period === "allData") return "All Data"
    if (period === "thisYear") return "This Year"
    if (period === "past3Years") return "Past 3 Years"
    if (period === "year") return `${startDate.getFullYear()}`
    return `${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
  }, [period, startDate, endDate])

  const handlePeriodChange = useCallback(
    (value: string) => {
      const now = new Date()
      const currentYear = now.getFullYear()

      setPeriod(value)
      if (value === "thisYear") {
        setStartDate(new Date(currentYear, 0, 1))
        setEndDate(new Date(currentYear, 11, 31))
      } else if (value === "past3Years") {
        setStartDate(new Date(currentYear - 3, 0, 1))
        setEndDate(new Date(currentYear, 11, 31))
      } else if (value === "allData") {
        setStartDate(new Date(2000, 0, 1)) // 最古データ
        setEndDate(new Date(currentYear, 11, 31)) // 今年末
      }
    },
    [setPeriod, setStartDate, setEndDate]
  )

  const handleYearChange = useCallback(
    (year: string) => {
      const selectedYear = Number.parseInt(year)
      setStartDate(new Date(selectedYear, 0, 1))
      setEndDate(new Date(selectedYear, 11, 31))
    },
    [setStartDate, setEndDate],
  )

  const handleStartDateChange = useCallback(
    (date: Date) => {
      setStartDate(date)
      if (date > endDate) setEndDate(date)
      setShowDatePicker(false)
    },
    [setStartDate, endDate, setEndDate],
  )

  const handleEndDateChange = useCallback(
    (date: Date) => {
      setEndDate(date)
      if (date < startDate) setStartDate(date)
      setShowDatePicker(false)
    },
    [setEndDate, startDate, setStartDate],
  )

  const goToPreviousMonth = useCallback(() => {
    const prev = new Date(currentMonth)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentMonth(prev)
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + 1)
    setCurrentMonth(next)
  }, [currentMonth])

  const selectYear = useCallback((year: number) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(year)
    setCurrentMonth(newDate)
    setCurrentView("calendar")
  }, [currentMonth])

  const selectMonth = useCallback((monthIndex: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(monthIndex)
    setCurrentMonth(newDate)
    setCurrentView("calendar")
  }, [currentMonth])

  const openDatePicker = useCallback((type: "start" | "end") => {
    setDatePickerFor(type)
    setCurrentView("calendar")
    setCurrentMonth(type === "start" ? new Date(startDate) : new Date(endDate))
    setShowDatePicker(true)
  }, [startDate, endDate])

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay()

  const generateCalendarDays = useCallback(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth()
    const days = getDaysInMonth(y, m)
    const firstDay = getFirstDayOfMonth(y, m)
    const prevDays = m === 0 ? getDaysInMonth(y - 1, 11) : getDaysInMonth(y, m - 1)

    const calendar: { date: Date, isCurrentMonth: boolean }[] = []
    for (let i = 0; i < firstDay; i++) {
      const d = prevDays - firstDay + i + 1
      calendar.push({ date: new Date(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, d), isCurrentMonth: false })
    }
    for (let i = 1; i <= days; i++) calendar.push({ date: new Date(y, m, i), isCurrentMonth: true })
    for (let i = 1; calendar.length < 42; i++) calendar.push({ date: new Date(m === 11 ? y + 1 : y, (m + 1) % 12, i), isCurrentMonth: false })

    return calendar
  }, [currentMonth])

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  const CustomCalendar = () => (
    <Card className="mt-2 p-0 overflow-hidden">
      <CardContent className="p-0">
        {currentView === "calendar" && (
          <>
            <div className="flex items-center justify-between p-2 border-b">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setCurrentView("yearSelect")}>{currentMonth.getFullYear()}</Button>
                <Button variant="ghost" onClick={() => setCurrentView("monthSelect")}>{MONTHS[currentMonth.getMonth()]}</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-7 gap-1 mb-1">{WEEKDAYS.map((d, i) => <div key={i} className="text-center text-sm text-muted-foreground">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-full p-0 text-sm ${!day.isCurrentMonth ? "text-muted-foreground opacity-50" : ""} ${isToday(day.date) ? "bg-accent text-accent-foreground" : ""}`}
                    onClick={() => (datePickerFor === "start" ? handleStartDateChange(day.date) : handleEndDateChange(day.date))}
                  >
                    {day.date.getDate()}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {currentView === "yearSelect" && (
          <div className="p-2">
            <div className="flex justify-between items-center mb-2">
              <Button variant="ghost" onClick={() => setCurrentView("calendar")}>← Back</Button>
              <div className="text-sm font-medium">Select Year</div>
              <div className="w-16" />
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-[200px] overflow-y-auto">
              {calendarYears.map((year) => (
                <Button key={year} variant={year === currentMonth.getFullYear() ? "default" : "ghost"} size="sm" className="h-8" onClick={() => selectYear(year)}>{year}</Button>
              ))}
            </div>
          </div>
        )}

        {currentView === "monthSelect" && (
          <div className="p-2">
            <div className="flex justify-between items-center mb-2">
              <Button variant="ghost" onClick={() => setCurrentView("calendar")}>← Back</Button>
              <div className="text-sm font-medium">Select Month</div>
              <div className="w-16" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => (
                <Button key={i} variant={i === currentMonth.getMonth() ? "default" : "ghost"} size="sm" className="h-8" onClick={() => selectMonth(i)}>{m}</Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
            {[
              ["allData", "All Data"],
              ["thisYear", "This Year"],
              ["past3Years", "Past 3 Years"],
              ["year", "Select Year"],
              ["custom", "Custom Period"]
            ].map(([val, label]) => (
              <div key={val} className="flex items-center space-x-2">
                <RadioGroupItem value={val} id={val} />
                <Label htmlFor={val}>{label}</Label>
              </div>
            ))}
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
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {period === "custom" && (
            <div className="grid gap-2">
              {["start", "end"].map((key) => (
                <div key={key} className="grid gap-1">
                  <Label htmlFor={`${key}Date`}>{key === "start" ? "Start Date" : "End Date"}</Label>
                  <Button
                    id={`${key}Date`}
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => openDatePicker(key as "start" | "end")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(key === "start" ? startDate : endDate, "yyyy/MM/dd")}
                  </Button>
                </div>
              ))}
              {showDatePicker && <CustomCalendar />}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}