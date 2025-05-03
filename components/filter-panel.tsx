"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import SpeciesSelector from "@/components/species-selector"
import PeriodSelector from "@/components/period-selector"
import type { PeriodSelectorProps } from "@/types/app-types"

interface SimpleFilterPanelProps {
  periodProps: PeriodSelectorProps
  onSpeciesSelect: (speciesCode: string | null) => void
  onGetData: () => Promise<void>  
}

export default function SimpleFilterPanel({ periodProps, onSpeciesSelect, onGetData }: SimpleFilterPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  const handleGetData = async () => {
    try {
      setStatus("loading")
      await onGetData()
      setStatus("success")
      setTimeout(() => setStatus("idle"), 2000) 
    } catch (error) {
      console.error("Failed to get data:", error)
      setStatus("idle")
    }
  }

  return (
    <div className="w-full space-y-6 p-4 rounded-md">
      {/* Period Picker */}
      <div>
        <Label className="block text-sm font-medium mb-2">Observation Period</Label>
        <PeriodSelector {...periodProps} />
      </div>

      {/* Species Picker */}
      <div>
        <Label className="block text-sm font-medium mb-2">Bird Species</Label>
        <SpeciesSelector onSelect={onSpeciesSelect} />
      </div>

      {/* Get Data Button */}
      <div>
        <Button
          onClick={handleGetData}
          className={`w-full p-6 mt-6 transition-all ${
            status === "success" ? "bg-green-500 hover:bg-green-600" : ""
          }`}
          disabled={status === "loading"}
        >
          {status === "success" ? "Got it!" : status === "loading" ? "Loading..." : "Get Data"}
        </Button>
      </div>
    </div>
  )
}