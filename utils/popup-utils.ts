import type { BirdObservation } from "@/types/birds"

/**
 * ポップアップコンテンツを作成する関数
 */
export function createPopupContent(observation: BirdObservation, isMobile: boolean): string {
  return isMobile
    ? `
    <div>
      <h3 class="font-bold">${observation.comName}</h3>
      <p>${observation.obsDt} ${observation.obsTime || ""}</p>
      <p>Count: ${observation.howMany || "?"}</p>
    </div>
    `
    : `
    <div>
      <h3 class="font-bold">${observation.comName} (${observation.sciName})</h3>
      <p>Observed: ${observation.obsDt} ${observation.obsTime || "Time unknown"}</p>
      <p>Location: ${observation.locName}</p>
      <p>Observer: ${observation.userDisplayName}</p>
      <p>Count: ${observation.howMany || "Unknown"}</p>
    </div>
    `
}
