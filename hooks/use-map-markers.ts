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
 * マップ上のマーカー生成をまとめたカスタムフック
 * ───────────────────────────────────────────────
 * - 永続ドット   : createPersistentMarker()
 * - アクティブ円 : createActiveMarker()  ➜ ２枚重ねでパルス演出
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

      /* --- パルス用のdivマーカー（外側に拡散） --- */
      const pulseMarker = L.marker([obs.lat, obs.lng], {
        icon: L.divIcon({
          className: "pulse-circle",
          iconSize: [baseRadius * 4, baseRadius * 4],
          html: `<div style="
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: ${ACTIVE_MARKER_STYLE.fillColor};
            opacity: 0.7;
            z-index: 10000;
          "></div>`
        }),
        interactive: false,
      })

      /* --- ポップアップをメイン円にのみバインド --- */
      mainCircle.bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      /* --- ２つを重ねて返す --- */
      return L.layerGroup([pulseMarker, mainCircle])
    },
    [isMobile],
  )

  return {
    createPersistentMarker,
    createActiveMarker,
  }
}
  