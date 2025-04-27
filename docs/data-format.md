# データ形式と使用方法

## データ構造

このアプリケーションは、eBird APIから取得した鳥の観測データを使用しています。データは以下の形式で構造化されています：

\`\`\`typescript
interface BirdObservation {
  speciesCode: string      // 種のコード（例: "blkkit1"）
  comName: string          // 一般名（例: "Black Kite"）
  sciName: string          // 学名（例: "Milvus migrans"）
  locId: string            // 場所ID（例: "L1234567"）
  locName: string          // 場所名（例: "Gardens by the Bay"）
  obsDt: string            // 観測日（例: "2023-04-21"）
  obsTime?: string         // 観測時間（例: "08:30"）
  howMany?: number         // 観測された鳥の数
  lat: number              // 緯度
  lng: number              // 経度
  obsValid: boolean        // 観測が有効かどうか
  obsReviewed: boolean     // 観測がレビューされたかどうか
  locationPrivate: boolean // 場所が非公開かどうか
  userDisplayName: string  // 観測者の表示名
}
\`\`\`

## データの取得方法

現在、アプリケーションは以下の方法でデータを取得しています：

1. **API経由**：`/api/birds` エンドポイントを使用して、サーバーサイドでデータを取得します。
2. **CSVファイル**：`/data/observations.csv` からデータを読み込みます。

実際の実装では、eBird APIを使用してリアルタイムのデータを取得することも可能です。

## データの使用方法

1. **データの読み込み**：
   - アプリケーション起動時に `useBirdData` フックを通じてデータを読み込みます。
   - `fetchBirdObservations` 関数を使用してデータを取得します。

2. **データのフィルタリング**：
   - `useMapFilter` フックの `filterObservations` 関数を使用して、以下の条件でデータをフィルタリングします：
     - 選択された鳥の種類
     - 時間値（スライダーの位置）
     - 開始日と終了日
     - 全表示モードかどうか
     - 長期間表示モードかどうか
     - 現在の表示日

3. **データの表示**：
   - フィルタリングされたデータは、Leafletマップ上にマーカーとして表示されます。
   - アクティブな観測は赤い円で表示され、過去の観測は小さな赤い点で表示されます。

## 本物のデータを使用する方法

本物のデータを使用するには、以下の手順に従ってください：

1. **eBird APIキーの取得**：
   - [eBird API](https://documenter.getpostman.com/view/664302/S1ENwy59) にアクセスし、APIキーを取得します。

2. **環境変数の設定**：
   - `.env.local` ファイルを作成し、APIキーを設定します：
     \`\`\`
     EBIRD_API_KEY=your_api_key_here
     \`\`\`

3. **API関数の更新**：
   - `lib/api.ts` ファイルの `fetchBirdObservations` 関数を更新して、実際のeBird APIを呼び出すようにします：
     \`\`\`typescript
     export async function fetchBirdObservations(): Promise<BirdObservation[]> {
       const apiKey = process.env.EBIRD_API_KEY
       const region = "SG" // シンガポール
       const url = `https://api.ebird.org/v2/data/obs/${region}/recent`
       
       const response = await fetch(url, {
         headers: {
           "X-eBirdApiToken": apiKey || ""
         }
       })
       
       if (!response.ok) {
         throw new Error("Failed to fetch bird observations")
       }
       
       const data = await response.json()
       return data
     }
     \`\`\`

4. **CSVデータの準備**：
   - 過去のデータを使用する場合は、CSVファイルを `/data/observations.csv` に配置します。
   - CSVファイルは、上記のデータ構造に合わせたヘッダーを持つ必要があります。

5. **データ取得の自動化**：
   - 定期的にデータを更新するために、Cronジョブやスケジュールされたタスクを設定することができます。
   - または、ユーザーがデータを手動で更新できるように、更新ボタンを提供することもできます。

## データの拡張

現在のデータモデルは、以下のように拡張することができます：

1. **追加のメタデータ**：
   - 鳥の行動（採餌、飛行など）
   - 観測の詳細（写真、音声など）
   - 天候条件

2. **時系列データ**：
   - 同じ場所での観測の時系列変化
   - 季節ごとの観測パターン

3. **地理的データ**：
   - 生息地の種類
   - 保護区域との関係
