import type { BirdObservation } from "@/types/birds"

/**
 * ポップアップコンテンツを作成する関数
 */
export function createPopupContent(observation: BirdObservation, isMobile: boolean): string {
  const { comName, sciName, obsDt, obsTime, howMany, lat, lng } = observation

  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`

  return isMobile
    ? `
      <div>
        <h3 class="font-bold">${comName}</h3>
        <p>${obsDt} ${obsTime || ""}</p>
        <p>Count: ${howMany ?? "?"}</p>
        <p><a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">Location</a></p>
      </div>
    `
    : `
      <div>
        <h3 class="font-bold">${comName} (${sciName})</h3>
        <p>Observed: ${obsDt}</p>
        <p>Location: <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">Location</a></p>
        <p>Count: ${howMany ?? "Unknown"}</p>
      </div>
    `
}