"use client"

import { useCallback } from "react"
import L from "leaflet"
import type { BirdObservation } from "@/types/birds"
import {
  ACTIVE_MARKER_STYLE,
  PERSISTENT_MARKER_STYLE,
} from "@/constants/marker-constants"
import { createPopupContent } from "@/utils/popup-utils"

/**
 *  マップ上のマーカー生成をまとめたカスタムフック
 *  ───────────────────────────────────────────────
 *  - 永続ドット   : createPersistentMarker()
 *  - アクティブ円 : createActiveMarker()  ➜ ２枚重ねでパルス演出
 */
export function useMapMarkers(isMobile: boolean) {
  /* ──────────────────────────────
   *  永続（薄い点）マーカー
   * ────────────────────────────── */
  const createPersistentMarker = useCallback(
    (obs: BirdObservation) => {
      const marker = L.circleMarker([obs.lat, obs.lng], {
        ...PERSISTENT_MARKER_STYLE,
        radius: isMobile
          ? PERSISTENT_MARKER_STYLE.radius * 1.5
          : PERSISTENT_MARKER_STYLE.radius,
      }).bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      return marker
    },
    [isMobile],
  )

  /* ──────────────────────────────
   *  アクティブ（パルス付き）マーカー
   * ────────────────────────────── */
  const createActiveMarker = useCallback(
    (obs: BirdObservation) => {
      /* --- 描画半径を算出（howMany が無ければ最小値） --- */
      const baseMultiplier = isMobile ? 4 : 3
      const minRadius = isMobile ? 8 : 5
      const maxRadius = isMobile ? 40 : 30
      const baseRadius = obs.howMany
        ? Math.min(Math.max(obs.howMany * baseMultiplier, minRadius), maxRadius)
        : minRadius

      /* --- メインの円 (静止) --- */
      const mainCircle = L.circleMarker([obs.lat, obs.lng], {
        radius: baseRadius,
        fillColor: ACTIVE_MARKER_STYLE.fillColor,
        color: ACTIVE_MARKER_STYLE.color,
        weight: ACTIVE_MARKER_STYLE.weight,
        opacity: ACTIVE_MARKER_STYLE.opacity,
        fillOpacity: ACTIVE_MARKER_STYLE.fillOpacity,
        className: "observation-marker",
      })

      /* --- パルス用の円（外側に拡散） --- */
      const pulseCircle = L.circleMarker([obs.lat, obs.lng], {
        radius: baseRadius,
        fillColor: ACTIVE_MARKER_STYLE.fillColor,
        color: "transparent",
        fillOpacity: 0.4,
        className: "observation-marker pulse-circle", // ←コンマではなく半角スペース
        // strokeを無しにして “色付きの影” だけ拡張させたい場合
        // stroke: false,
      })

      /* --- ポップアップをメイン円にのみバインド --- */
      mainCircle.bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      /* --- ２つを重ねて返す --- */
      return L.layerGroup([pulseCircle, mainCircle])
    },
    [isMobile],
  )

  return {
    createPersistentMarker,
    createActiveMarker,
  }
}