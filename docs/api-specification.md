# API仕様書

このドキュメントでは、シンガポール鳥類観測マップアプリケーションで使用するAPIの仕様を説明します。

## ベースURL

\`\`\`
https://api.example.com
\`\`\`

開発環境では、環境変数`NEXT_PUBLIC_API_URL`で設定されたURLが使用されます。

## 認証

現在、APIは認証を必要としません。将来的にはAPIキーベースの認証が追加される予定です。

## エンドポイント

### 観測データの取得

#### すべての種の観測データを取得

\`\`\`
GET /species/observations
\`\`\`

##### パラメータ

| パラメータ | 説明 | 必須 | 例 |
|------------|------|------|-----|
| `start` | 開始日（YYYY-MM-DD形式） | いいえ | `2023-01-01` |
| `end` | 終了日（YYYY-MM-DD形式） | いいえ | `2023-12-31` |

##### レスポンス

\`\`\`json
[
  {
    "id": 1234,
    "species_code": "redjun",
    "com_name": "Red Junglefowl",
    "sci_name": "Gallus gallus",
    "obs_dt": "2023-02-15",
    "obs_time": "08:30",
    "how_many": 2,
    "lat": 1.3521,
    "lng": 103.8198,
    "location_name": "Pulau Ubin",
    "location_id": "L12345678",
    "obs_valid": true,
    "obs_reviewed": false,
    "location_private": false,
    "user_display_name": "birdwatcher_sg",
    "subnational1_name": "Singapore",
    "subnational2_name": "North East Region"
  },
  // ...
]
\`\`\`

#### 特定の種の観測データを取得

\`\`\`
GET /species/{speciesCode}/observations
\`\`\`

##### パラメータ

| パラメータ | 説明 | 必須 | 例 |
|------------|------|------|-----|
| `speciesCode` | 種のコード | はい | `redjun` |
| `start` | 開始日（YYYY-MM-DD形式） | いいえ | `2023-01-01` |
| `end` | 終了日（YYYY-MM-DD形式） | いいえ | `2023-12-31` |

##### レスポンス

\`\`\`json
[
  {
    "id": 1234,
    "species_code": "redjun",
    "com_name": "Red Junglefowl",
    "sci_name": "Gallus gallus",
    "obs_dt": "2023-02-15",
    "obs_time": "08:30",
    "how_many": 2,
    "lat": 1.3521,
    "lng": 103.8198,
    "location_name": "Pulau Ubin",
    "location_id": "L12345678",
    "obs_valid": true,
    "obs_reviewed": false,
    "location_private": false,
    "user_display_name": "birdwatcher_sg",
    "subnational1_name": "Singapore",
    "subnational2_name": "North East Region"
  },
  // ...
]
\`\`\`

### 種リストの取得

\`\`\`
GET /countries/{countryCode}/species/
\`\`\`

##### パラメータ

| パラメータ | 説明 | 必須 | 例 |
|------------|------|------|-----|
| `countryCode` | 国コード | はい | `SG` |

##### レスポンス

\`\`\`json
[
  {
    "id": 1,
    "species_code": "redjun",
    "com_name": "Red Junglefowl",
    "sci_name": "Gallus gallus",
    "country_count": 25,
    "image_url": "https://example.com/image1.jpg"
  },
  // ...
]
\`\`\`

### ホットスポットの取得

\`\`\`
GET /countries/{countryCode}/hotspots/
\`\`\`

##### パラメータ

| パラメータ | 説明 | 必須 | 例 |
|------------|------|------|-----|
| `countryCode` | 国コード | はい | `SG` |

##### レスポンス

\`\`\`json
[
  {
    "loc_id": "L12345678",
    "name": "Pulau Ubin",
    "latitude": 1.3521,
    "longitude": 103.8198,
    "country_code": "SG",
    "country_name": "Singapore",
    "subnational1_code": "SG-01",
    "subnational1_name": "Singapore",
    "subnational2_code": "SG-NE",
    "subnational2_name": "North East Region",
    "is_hotspot": true,
    "num_species_all_time": 120,
    "latest_obs_dt": "2023-05-15"
  },
  // ...
]
\`\`\`

## エラーレスポンス

APIはエラーが発生した場合、適切なHTTPステータスコードとともにJSONレスポンスを返します。

\`\`\`json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details"
}
\`\`\`

## レート制限

現在、APIにはレート制限はありません。将来的にはレート制限が追加される予定です。

## データ更新頻度

観測データは毎日更新されます。種リストとホットスポット情報は月に一度更新されます。
