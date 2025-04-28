"use client"

import { useCallback } from "react"
import L from "leaflet"
import type { BirdObservation } from "@/types/birds"
import {
  ACTIVE_MARKER_STYLE,
  PERSISTENT_MARKER_STYLE,
} from "@/constants/marker-constants"
import { createPopupContent } from "@/utils/popup-utils"

export function useMapMarkers(isMobile: boolean) {
  /* ── 薄い点 ──────────────────────────────── */
  const createPersistentMarker = useCallback(
    (obs: BirdObservation) =>
      L.circleMarker([obs.lat, obs.lng], {
        ...PERSISTENT_MARKER_STYLE,
        radius: isMobile
          ? PERSISTENT_MARKER_STYLE.radius * 1.5
          : PERSISTENT_MARKER_STYLE.radius,
      }).bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset  : isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      }),
    [isMobile],
  )

  /* ── 点＋パルス ──────────────────────────── */
  const createActiveMarker = useCallback(
    (obs: BirdObservation) => {
      /* 半径計算 */
      const mult = isMobile ? 2 : 3
      const min  = isMobile ? 3 : 5
      const max  = isMobile ? 20 : 30
      const r    = obs.howMany
        ? Math.min(Math.max(obs.howMany * mult, min), max)
        : min

      /* 点の円 */
      const mainCircle = L.circleMarker([obs.lat, obs.lng], {
        radius      : r,
        fillColor   : ACTIVE_MARKER_STYLE.fillColor,
        color       : ACTIVE_MARKER_STYLE.color,
        weight      : ACTIVE_MARKER_STYLE.weight,
        opacity     : ACTIVE_MARKER_STYLE.opacity,
        fillOpacity : ACTIVE_MARKER_STYLE.fillOpacity,
        className   : "observation-marker",
      }).bindPopup(createPopupContent(obs, isMobile), {
        maxWidth: isMobile ? 200 : 300,
        offset  : isMobile ? new L.Point(0, -10) : new L.Point(0, 0),
      })

      /* パルスは外側 divIcon 内に “実パルス div” を描く */
      const size   = r * 4
      const anchor = size / 2
      const pulseMarker = L.marker([obs.lat, obs.lng], {
        icon: L.divIcon({
          className : "",     
          iconSize  : [size, size],
          iconAnchor: [anchor, anchor],
          html: `
            <div class="pulse-circle" style="
              width : ${size}px;
              height: ${size}px;
            "></div>
          `,
        }),
        interactive: false,
      })

      return { mainCircle, pulseMarker }
    },
    [isMobile],
  )

  return { createPersistentMarker, createActiveMarker }
}