import type { BirdObservation } from "./birds"

// 期間選択のタイプ
export type PeriodType = "thisYear" | "past3Years" | "year" | "custom" | "allData"

// マップコンポーネントのプロップス
export interface MapProps {
  observations: BirdObservation[]     
  onRefresh: (
    speciesCode?: string,
    startDate?: string,
    endDate?: string
  ) => void                                 
  selectedSpecies: string | null
  timeValue: number
  startDate: Date
  endDate: Date
  showAll: boolean
  isPlaying: boolean
  isLongTermView: boolean
  currentViewDate: Date
  showHeatmap: boolean
}

// 期間選択コンポーネントのプロップス
export interface PeriodSelectorProps {
  period: PeriodType
  setPeriod: (period: PeriodType) => void
  startDate: Date
  setStartDate: (date: Date) => void
  endDate: Date
  setEndDate: (date: Date) => void
}

// 種選択コンポーネントのプロップス
export interface SpeciesSelectorProps {
  onSelect: (speciesCode: string | null) => void
}

// 時間コントロールコンポーネントのプロップス
export interface TimeControlProps {
  timeValue: number[]
  setTimeValue: (value: number[]) => void
  isPlaying: boolean
  togglePlay: () => void
  showAll: boolean
  toggleShowAll: () => void
  showHeatmap: boolean
  toggleShowHeatmap: () => void
  startDate: Date
  endDate: Date
  isLongTermView: boolean
  currentViewDate: Date
  disabled?: boolean
}

// フィルタリング結果
export interface FilterResult {
  filtered: BirdObservation[]
  newObservations: BirdObservation[]
}