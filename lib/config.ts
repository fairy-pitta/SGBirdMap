import type { AppConfig } from "@/types/app-config"

/**
 * アプリケーションの設定
 */
const config: AppConfig = {
  map: {
    center: [1.3521, 103.8198], // シンガポールの中心座標
    zoom: 12,
    minZoom: 10,
    maxZoom: 18,
  },

  animation: {
    speed: 300, // ミリ秒
    increment: 0.5,
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
    endpoints: {
      observations: "/species/observations",
      species: "/countries/SG/species/",
    },
  },

  display: {
    longTermThreshold: 30, // 30日以上を長期間表示とみなす
    maxMarkerSize: 30,
    minMarkerSize: 5,
  },
}

export default config
