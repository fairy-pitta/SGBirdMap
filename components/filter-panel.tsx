"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import SpeciesSelector from "@/components/species-selector"
import PeriodSelector from "@/components/period-selector"
import AboutSheet from "@/components/about"
import type { PeriodSelectorProps } from "@/types/app-types"
import { getCachedPreferences, setCachedPreferences } from "@/lib/cache"

interface SimpleFilterPanelProps {
  periodProps: PeriodSelectorProps
  onSpeciesSelect: (speciesCode: string | null) => void
  onGetData: () => Promise<void>  
}

export default function SimpleFilterPanel({ periodProps, onSpeciesSelect, onGetData }: SimpleFilterPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")
  const [species, setSpecies] = useState<string | null>(null)

  const handleGetData = async () => {
    try {
      setStatus("loading")
      await onGetData()
      setStatus("success")
      setTimeout(() => setStatus("idle"), 2000)
      // 保存
      setCachedPreferences({
        startDate: periodProps.startDate.toISOString(),
        endDate: periodProps.endDate.toISOString(),
        speciesCode: species,
      })
    } catch (error) {
      console.error("Failed to get data:", error)
      setStatus("idle")
    }
  }

  useEffect(() => {
    const cached = getCachedPreferences()
    if (!cached) return
    try {
      const sDate = new Date(cached.startDate)
      const eDate = new Date(cached.endDate)
      periodProps.setStartDate(sDate)
      periodProps.setEndDate(eDate)
      onSpeciesSelect(cached.speciesCode)
      setSpecies(cached.speciesCode)
    } catch (e) {
      console.warn("Failed to restore cached preferences", e)
    }
  }, [])

  const handleSpeciesSelect = (code: string | null) => {
    setSpecies(code)
    onSpeciesSelect(code)
  }

  return (
    <div className="w-full space-y-6 p-4 rounded-md">
      <AboutSheet />

      {/* Period Picker */}
      <div>
        <Label className="block text-sm font-medium mb-2">Observation Period</Label>
        <PeriodSelector {...periodProps} />
      </div>

      {/* Species Picker */}
      <div>
        <Label className="block text-sm font-medium mb-2">Bird Species</Label>
        <SpeciesSelector onSelect={handleSpeciesSelect} />
      </div>

      {/* Get Data Button */}
      <div>
        <Button
          onClick={handleGetData}
          className={`w-full p-6 mt-6 transition-all ${
            status === "success" ? "bg-green-500 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          disabled={status === "loading"}
        >
          {status === "success" ? "Got it!" : status === "loading" ? "Loading..." : "Get Data"}
        </Button>
      </div>
    </div>
  )
}