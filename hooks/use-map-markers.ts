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
 * - アクティブ円 : createActiveMarker()  ➜ 点とパルスを分離管理
 */
export function useMapMarkers(isMobile: boolean) {
  /**
   * 永続（薄い点）マーカー
   */
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

  /**
   * アクティブ（パルス付き）マーカー
   */
  const createActiveMarker = useCallback(
    (obs: BirdObservation) => {
      const baseMultiplier = isMobile ? 4 : 3
      const minRadius = isMobile ? 8 : 5
      const maxRadius = isMobile ? 40 : 30
      const baseRadius = obs.howMany
        ? Math.min(Math.max(obs.howMany * baseMultiplier, minRadius), maxRadius)
        : minRadius
  
      const mainCircle = L.circleMarker([obs.lat, obs.lng], {
        radius: baseRadius,
        fillColor: ACTIVE_MARKER_STYLE.fillColor,
        color: ACTIVE_MARKER_STYLE.color,
        weight: ACTIVE_MARKER_STYLE.weight,
        opacity: ACTIVE_MARKER_STYLE.opacity,
        fillOpacity: ACTIVE_MARKER_STYLE.fillOpacity,
        className: "observation-marker",
      })

      const pulseMarker = L.marker([obs.lat, obs.lng], {
        icon: L.divIcon({
          className: "",  // ここではクラスなし
          html: `
            <div style="
              width: ${baseRadius * 4}px;
              height: ${baseRadius * 4}px;
              margin-left: -${baseRadius * 2}px;
              margin-top: -${baseRadius * 2}px;
              background: red;
              border-radius: 50%;
              opacity: 0.6;
              animation: pulse 6s ease-out infinite;
              position: absolute;
              transform: translate(-50%, -50%);
            "></div>`,
          iconSize: [0, 0],  // ← これ必須！ (divのサイズでやるので0にする)
        }),
        interactive: false,
      })
  
      mainCircle.bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset: isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })
  
      return { mainCircle, pulseMarker }
    },
    [isMobile],
  )

  return {
    createPersistentMarker,
    createActiveMarker,
  }
}
