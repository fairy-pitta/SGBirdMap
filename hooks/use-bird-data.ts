"use client"

import { useState, useCallback } from "react"
import { fetchBirdObservations } from "@/lib/api"
import type { BirdObservation } from "@/types/birds"
import type { FilterResult } from "@/types/app-types"

/* -------------------------------------------------- */
/*  キャッシュ関連                                    */
/* -------------------------------------------------- */
interface DataCacheEntry {
  data: BirdObservation[]
  timestamp: number          // 保存時刻（ms）
}
interface DataCache {
  [key: string]: DataCacheEntry
}

const CACHE_DURATION = 5 * 60 * 1000 // 5分

/* shallow に同値判定するユーティリティ */
const shallowEqual = (a: BirdObservation[], b: BirdObservation[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

/* -------------------------------------------------- */
/*  Hook                                              */
/* -------------------------------------------------- */
export function useBirdData() {
  /* 状態 */
  const [observations, setObservations]       = useState<BirdObservation[]>([])
  const [filteredObservations, setFiltered]   = useState<BirdObservation[]>([])
  const [newObservations, setNew]             = useState<BirdObservation[]>([])
  const [isLoading, setIsLoading]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  /* キャッシュ */
  const [cache, setCache]                     = useState<DataCache>({})

  /* -------------------------------------------------- */
  /*  内部ヘルパ                                       */
  /* -------------------------------------------------- */
  const cacheKey = useCallback(
    (sp?: string, s?: string, e?: string) => `${sp || "all"}_${s || ""}_${e || ""}`,
    [],
  )

  const readCache = useCallback(
    (key: string): BirdObservation[] | null => {
      const entry = cache[key]
      return entry && Date.now() - entry.timestamp < CACHE_DURATION ? entry.data : null
    },
    [cache],
  )

  const writeCache = useCallback((key: string, data: BirdObservation[]) => {
    setCache(prev => ({ ...prev, [key]: { data, timestamp: Date.now() } }))
  }, [])

  /* -------------------------------------------------- */
  /*  Public: データ取得                                */
  /* -------------------------------------------------- */
  const refreshData = useCallback(
    async (speciesCode?: string, start?: string, end?: string) => {
      if (!speciesCode) {
        console.warn("No species selected, skip refresh")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const key = cacheKey(speciesCode, start, end)
        const cached = readCache(key)

        let nextData = cached
        if (!nextData) {
          console.log(`🔄 Fetching ${speciesCode} ${start}–${end}`)
          nextData = await fetchBirdObservations(speciesCode, start, end)
          writeCache(key, nextData)
        } else {
          console.log("✅ Using cached observation data")
        }

        /* ★ 変更が無いときは setState しない ★ */
        setObservations(prev => (shallowEqual(prev, nextData!) ? prev : nextData!))
      } catch (err) {
        console.error("Failed to fetch bird observations:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    },
    [cacheKey, readCache, writeCache],
  )

  /* -------------------------------------------------- */
  /*  Public: フィルタ結果を Map から受け取る           */
  /* -------------------------------------------------- */
  const updateFilteredData = useCallback((r: FilterResult) => {
    setFiltered(prev => (shallowEqual(prev, r.filtered) ? prev : r.filtered))
    setNew(prev       => (shallowEqual(prev, r.newObservations) ? prev : r.newObservations))
  }, [])

  /* -------------------------------------------------- */
  /*  Public: ユーティリティ                           */
  /* -------------------------------------------------- */
  const clearCache = useCallback(() => setCache({}), [])

  /* -------------------------------------------------- */
  /*  Export                                           */
  /* -------------------------------------------------- */
  return {
    /* データ */
    observations,
    filteredObservations,
    newObservations,

    /* 状態 */
    isLoading,
    error,
    dataSource: "api" as const,

    /* 操作 */
    refreshData,
    updateFilteredData,
    clearCache,
  }
}

export type UseBirdDataReturnType = ReturnType<typeof useBirdData>