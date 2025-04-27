"use client"

import { useCallback, useRef } from "react"
import type { BirdObservation } from "@/types/birds"
import type { FilterResult } from "@/types/app-types"

/** shallow 比較用ユーティリティ */
const isSameObs = (a: BirdObservation, b: BirdObservation) =>
  a.speciesCode === b.speciesCode &&
  a.lat         === b.lat &&
  a.lng         === b.lng &&
  a.obsDt       === b.obsDt &&
  a.obsTime     === b.obsTime

export function useMapFilter() {
  /* 前回の結果は useRef で保持（setState しないので再レンダを誘発しない） */
  const prevFilteredRef = useRef<BirdObservation[]>([])

  /** 観測データをフィルタリングする純粋関数 */
  const filterObservations = useCallback((
    observations      : BirdObservation[],
    selectedSpecies   : string | null,
    timeValue         : number,
    startDate         : Date,
    endDate           : Date,
    showAll           : boolean,
    isLongTermView    : boolean,
    currentViewDate   : Date,
  ): FilterResult => {

    /* ---------- 個別フィルタ ---------- */
    const speciesOK  = (o: BirdObservation) =>
      !selectedSpecies || o.speciesCode === selectedSpecies

    const inDateRange = (o: BirdObservation) => {
      const d = new Date(o.obsDt)
      return d >= startDate && d <= endDate
    }

    const onCurrentDate = (o: BirdObservation) =>
      new Date(o.obsDt).toDateString() === currentViewDate.toDateString()

    const inTime = (o: BirdObservation) => {
      if (!o.obsTime) return true
      const [h, m] = o.obsTime.split(":").map(Number)
      const targetMin = Math.floor(timeValue / 100 * 24 * 60)
      const obsMin    = h * 60 + m
      return obsMin <= targetMin
    }

    /* ---------- 実際のフィルタ ---------- */
    let filtered: BirdObservation[]
    if (showAll) {
      filtered = observations.filter(o => speciesOK(o) && inDateRange(o))
    } else if (isLongTermView) {
      filtered = observations.filter(o => speciesOK(o) && onCurrentDate(o))
    } else {
      filtered = observations.filter(o => speciesOK(o) && inDateRange(o) && inTime(o))
    }

    /* ---------- newObservations 判定 ---------- */
    const prev = prevFilteredRef.current
    const newObs = filtered.filter(o => !prev.some(p => isSameObs(p, o)))

    /* 次回比較用に保持（ref 更新はレンダを起こさない） */
    prevFilteredRef.current = filtered

    return { filtered, newObservations: newObs }
  }, [])

  return { filterObservations }
}