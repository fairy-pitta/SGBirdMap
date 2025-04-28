import type { AppConfig } from "@/types/app-config"

const config: AppConfig = {
  map: {
    center: [1.3521, 103.8198], // シンガポール中心
    zoom: 12,
    minZoom: 10,
    maxZoom: 18,
  },

  animation: {
    speed: 300, // ms
    increment: 0.5,
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "",  
    endpoints: {
      observations: "/api/sgbirdsdate", 
      species: "/api/sgbirds",         
    },
  },

  display: {
    longTermThreshold: 30,
    maxMarkerSize: 30,
    minMarkerSize: 5,
  },
}

export default config