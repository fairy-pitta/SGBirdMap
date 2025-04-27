import type { BirdObservation } from "@/types/birds"

// APIのベースURLを環境変数から取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
console.log(API_URL, "this is api")

// サンプルデータ（APIが失敗した場合のフォールバック）
const sampleObservations: BirdObservation[] = [
  {
    speciesCode: "redjun",
    comName: "Red Junglefowl",
    sciName: "Gallus gallus",
    locId: "L1234567",
    locName: "Pulau Ubin",
    obsDt: "2023-02-15",
    obsTime: "08:30",
    howMany: 2,
    lat: 1.3521,
    lng: 103.8198,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    userDisplayName: "birdwatcher_sg",
  },
  {
    speciesCode: "whbsea",
    comName: "White-bellied Sea-Eagle",
    sciName: "Haliaeetus leucogaster",
    locId: "L87654321",
    locName: "Bukit Timah Nature Reserve",
    obsDt: "2023-05-21",
    obsTime: "09:15",
    howMany: 1,
    lat: 1.2956,
    lng: 103.7764,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    userDisplayName: "wildlife_fan",
  },
]

// サンプル種リスト（APIが失敗した場合のフォールバック）
const sampleSpecies = [
  {
    code: "redjun",
    comName: "Red Junglefowl",
    sciName: "Gallus gallus",
  },
  {
    code: "whbsea",
    comName: "White-bellied Sea-Eagle",
    sciName: "Haliaeetus leucogaster",
  },
]

/**
 * APIリクエストを実行する汎用関数
 */
async function fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  try {
    // パラメータの構築
    const queryParams = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null),
    )

    // 完全なURLを構築
    let url = API_URL ? `${API_URL}${endpoint}` : endpoint

    // パラメータがある場合のみ追加
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    console.log(`Fetching from: ${url}`)

    // APIリクエストの実行 (5秒タイムアウト付き)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    let response
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // 1時間キャッシュ
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('APIサーバーに接続できませんでした。サーバーが起動しているか確認してください。')
      }
      throw error
    }

    // レスポンスのステータスとコンテンツタイプをチェック
    if (!response.ok) {
      console.error(`API request failed with status ${response.status}: ${response.statusText}`)

      // レスポンスの内容をログに出力（デバッグ用）
      const text = await response.text()
      console.error(`Response content: ${text.substring(0, 200)}...`)

      throw new Error(`API request failed with status ${response.status}`)
    }

    // コンテンツタイプをチェック
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Expected JSON but got ${contentType}`)

      // レスポンスの内容をログに出力（デバッグ用）
      const text = await response.text()
      console.error(`Response content: ${text.substring(0, 200)}...`)

      throw new Error(`Expected JSON but got ${contentType}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API request failed:", error)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("API request timed out after 5 seconds")
    }
    throw error
  }
}

/**
 * 鳥の観測データを取得する
 */
export async function fetchBirdObservations(
  speciesCode?: string,
  startDate?: string,
  endDate?: string,
): Promise<BirdObservation[]> {
  try {
    // APIエンドポイント
    const endpoint = "/api/sgbirdsdate"

    const params: Record<string, string> = {}
    if (speciesCode) params.species = speciesCode
    if (startDate) params.date = startDate
    if (endDate) params.end = endDate

    const data = await fetchFromAPI<any[]>(endpoint, params)

    console.log("[DEBUG] API response data:", data)

    if (!Array.isArray(data)) {
      console.error("API response is not an array:", data)
      return sampleObservations
    }

    // APIレスポンスを BirdObservation にマッピング
    return data.map((item: any) => ({
      speciesCode: speciesCode || "", // リクエストからそのまま
      comName: "", // 不要なので空
      sciName: "", // 不要なので空
      locId: item.location_id || "",
      locName: item.location_name || "",
      obsDt: item.obs_dt || "",
      obsTime: undefined, // APIに無い
      howMany: undefined, // APIに無い
      lat: item.lat,
      lng: item.lng,
      obsValid: item.obs_valid !== undefined ? item.obs_valid : true,
      obsReviewed: item.obs_reviewed !== undefined ? item.obs_reviewed : false,
      locationPrivate: false, // もう全部falseでいい
      userDisplayName: item.user_display_name || "",
    }))
  } catch (error) {
    console.error("Failed to fetch bird observations:", error)
    return sampleObservations
  }
}

/**
 * 特定の種の観測データを取得する
 */
export async function fetchSpeciesObservations(
  speciesCode: string,
  startDate?: string,
  endDate?: string,
): Promise<BirdObservation[]> {
  return fetchBirdObservations(speciesCode, startDate, endDate)
}


export async function fetchSpeciesInSingapore(): Promise<any[]> {
  try {
    const endpoint = `/api/sgbirds/`
    const data = await fetchFromAPI<any[]>(endpoint)

    // 整形して返す
    return data.map((item: any) => ({
      code: item.species_code || item.code,
      comName: item.com_name || item.comName,
      sciName: item.sci_name || item.sciName,
    }))
  } catch (error) {
    console.error(`Failed to fetch species for Singapore:`, error)
    // APIが失敗した場合はサンプルデータを返す
    return sampleSpecies
  }
}
