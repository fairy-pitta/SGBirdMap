"use client"

import { useCallback } from "react"
import L from "leaflet"
import type { BirdObservation } from "@/types/birds"
import { ACTIVE_MARKER_STYLE, PERSISTENT_MARKER_STYLE } from "@/constants/marker-constants"
import { createPopupContent } from "@/utils/popup-utils"

/**
 * マップマーカーを管理するカスタムフック
 */
export function useMapMarkers(isMobile: boolean) {
  /**
   * 永続的なマーカー（点）を作成する関数
   */
  const createPersistentMarker = useCallback(
    (observation: BirdObservation) => {
      // 永続的なマーカー（点）を作成
      const persistentMarker = L.circleMarker([observation.lat, observation.lng], {
        ...PERSISTENT_MARKER_STYLE,
        // モバイルの場合は少し大きめに
        radius: isMobile ? PERSISTENT_MARKER_STYLE.radius * 1.5 : PERSISTENT_MARKER_STYLE.radius,
      })

      // ポップアップを追加
      const popupContent = createPopupContent(observation, isMobile)
      persistentMarker.bindPopup(popupContent, {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      return persistentMarker
    },
    [isMobile],
  )

  /**
   * アクティブなマーカー（円）を作成する関数
   */
  const createActiveMarker = useCallback(
    (observation: BirdObservation) => {
      // 鳥の数に基づいて半径を計算
      const baseMultiplier = isMobile ? 4 : 3
      const minRadius = isMobile ? 8 : 5
      const maxRadius = isMobile ? 40 : 30
      const baseRadius = observation.howMany
        ? Math.min(Math.max(observation.howMany * baseMultiplier, minRadius), maxRadius)
        : minRadius

      // 円マーカーを作成
      const circleMarker = L.circleMarker([observation.lat, observation.lng], {
        radius: baseRadius,
        fillColor: ACTIVE_MARKER_STYLE.fillColor,
        color: ACTIVE_MARKER_STYLE.color,
        weight: ACTIVE_MARKER_STYLE.weight,
        opacity: ACTIVE_MARKER_STYLE.opacity,
        fillOpacity: ACTIVE_MARKER_STYLE.fillOpacity,
        className: "observation-marker",
      })

      // パルスエフェクト用の2つ目の円
      const pulseCircle = L.circleMarker([observation.lat, observation.lng], {
        radius: baseRadius,
        fillColor: ACTIVE_MARKER_STYLE.fillColor,
        color: "transparent",
        fillOpacity: 0.4,
        className: "pulse-circle",
      })

      // ポップアップを追加
      const popupContent = createPopupContent(observation, isMobile)
      circleMarker.bindPopup(popupContent, {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      // マーカーをグループ化
      const group = L.layerGroup([circleMarker, pulseCircle])

      return group
    },
    [isMobile],
  )

  return {
    createPersistentMarker,
    createActiveMarker,
  }
}
