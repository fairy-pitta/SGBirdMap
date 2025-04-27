export interface Hotspot {
  locId: string
  name: string
  latitude: number
  longitude: number
  countryCode: string
  countryName: string
  subnational1Code: string
  subnational1Name: string
  subnational2Code?: string
  subnational2Name?: string
  isHotspot: boolean
  numSpeciesAllTime?: number
  latestObsDt?: string | null
}

export interface HotspotDetail extends Hotspot {
  hierarchicalName?: string
  locationType?: string
  institutionCode?: string
  numSpeciesAllTime?: number
  numSpeciesCurrentYear?: number
  isPublic?: boolean
  lastVisitDate?: string
  establishmentMeans?: string
  description?: string
}
