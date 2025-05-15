// lib/cache.ts
export const getCachedPreferences = () => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem("bird-map:preferences")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  
  export const setCachedPreferences = (prefs: {
    startDate: string
    endDate: string
    speciesCode: string | null
  }) => {
    if (typeof window === "undefined") return
    localStorage.setItem("bird-map:preferences", JSON.stringify(prefs))
  }