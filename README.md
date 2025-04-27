# シンガポール鳥類観測マップ (Singapore Bird Observation Map)

シンガポールの鳥類観測データを時系列で表示するインタラクティブなマップアプリケーションです。eBird APIから取得したデータを使用して、鳥類の観測地点と時間を視覚化します。

![アプリケーションのスクリーンショット](/placeholder.svg?height=400&width=800&query=bird%20observation%20map%20with%20timeline%20and%20filters)

## 機能一覧

- **インタラクティブマップ**: Leafletを使用した鳥類観測データの地図表示
- **時系列アニメーション**: 時間経過に伴う鳥類観測データの変化を表示
- **種フィルタリング**: 特定の鳥類種に絞った観測データの表示
- **期間選択**: 観測データの表示期間の選択（今年、過去3年、特定の年、カスタム期間）
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップに対応したUI
- **データ視覚化**: 観測数に応じたマーカーサイズの変更とアニメーション効果

## 技術スタック

- **フロントエンド**: Next.js (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **マップ**: Leaflet
- **データ取得**: eBird API
- **状態管理**: React Hooks

## 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上
- eBird APIキー（オプション、実際のデータを使用する場合）

## インストール方法

1. リポジトリをクローン
\`\`\`bash
git clone https://github.com/yourusername/singapore-bird-map.git
cd singapore-bird-map
\`\`\`

2. 依存関係をインストール
\`\`\`bash
npm install
\`\`\`

3. 環境変数の設定
\`\`\`bash
cp .env.local.example .env.local
# .env.localを編集して必要な環境変数を設定
\`\`\`

## 環境変数の設定

このアプリケーションでは、開発環境と本番環境でAPIのURLを切り替えるために環境変数を使用しています。

### 開発環境の設定

1. `.env.local.example`ファイルを`.env.local`にコピーします。
2. `.env.local`ファイルを編集して、必要な環境変数を設定します。

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

### 本番環境の設定

1. `.env.production.example`ファイルを`.env.production`にコピーします。
2. `.env.production`ファイルを編集して、必要な環境変数を設定します。

\`\`\`bash
cp .env.production.example .env.production
\`\`\`

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_API_URL` | APIのベースURL | `http://localhost:3000/api` または `https://api.example.com` |
| `EBIRD_API_KEY` | eBird APIキー | `your_ebird_api_key_here` |

## 開発環境と本番環境の切り替え

### 開発環境での実行

\`\`\`bash
npm run dev
\`\`\`

このコマンドは`.env.local`ファイルの環境変数を使用します。

### 本番環境用のビルド

\`\`\`bash
npm run build
\`\`\`

このコマンドは`.env.production`ファイルの環境変数を使用してアプリケーションをビルドします。

### 本番環境での実行

\`\`\`bash
npm run start
\`\`\`

このコマンドはビルドされたアプリケーションを実行します。

## APIの仕様

アプリケーションは以下のAPIエンドポイントを使用します：

### 観測データの取得

\`\`\`
GET /species/observations
GET /species/{speciesCode}/observations
\`\`\`

#### パラメータ

| パラメータ | 説明 | 必須 |
|------------|------|------|
| `start` | 開始日（YYYY-MM-DD形式） | いいえ |
| `end` | 終了日（YYYY-MM-DD形式） | いいえ |

#### レスポンス例

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
    "user_display_name": "birdwatcher_sg"
  }
]
\`\`\`

### 種リストの取得

\`\`\`
GET /countries/{countryCode}/species/
\`\`\`

#### パラメータ

| パラメータ | 説明 | 必須 |
|------------|------|------|
| `countryCode` | 国コード（例: "SG"） | はい |

#### レスポンス例

\`\`\`json
[
  {
    "id": 1,
    "species_code": "redjun",
    "com_name": "Red Junglefowl",
    "sci_name": "Gallus gallus",
    "country_count": 25,
    "image_url": "https://example.com/image1.jpg"
  }
]
\`\`\`

## データ構造

### 鳥類観測データ (BirdObservation)

\`\`\`typescript
interface BirdObservation {
  speciesCode: string      // 種のコード（例: "redjun"）
  comName: string          // 一般名（例: "Red Junglefowl"）
  sciName: string          // 学名（例: "Gallus gallus"）
  locId: string            // 場所ID（例: "L1234567"）
  locName: string          // 場所名（例: "Pulau Ubin"）
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

### 種情報

\`\`\`typescript
interface Species {
  code: string           // 種のコード（例: "redjun"）
  comName: string        // 一般名（例: "Red Junglefowl"）
  sciName: string        // 学名（例: "Gallus gallus"）
  imageUrl?: string      // 画像URL（オプション）
}
\`\`\`

## 使用方法

### 基本的な使い方

1. アプリケーションを起動すると、シンガポールの地図が表示されます。
2. 左側のパネルで鳥類の種類と観測期間を選択できます。
3. 下部のタイムラインスライダーを使用して、特定の時間の観測データを表示できます。
4. 再生ボタンをクリックすると、時間経過に伴う観測データの変化をアニメーションで表示します。
5. 「Show All」ボタンをクリックすると、選択した期間のすべての観測データを一度に表示します。

### モバイルでの使用

1. モバイルデバイスでは、左上のメニューボタンをタップして設定パネルを開きます。
2. 地図は指でピンチイン・ピンチアウトでズーム、ドラッグで移動できます。
3. 下部のタイムラインコントロールは簡略化されていますが、同様の機能を提供します。

## 開発ガイドライン

### コード構成

- `app/` - Next.jsのApp Routerページコンポーネント
- `components/` - 再利用可能なReactコンポーネント
- `hooks/` - カスタムReact Hooks
- `lib/` - ユーティリティ関数とAPIクライアント
- `types/` - TypeScriptの型定義
- `constants/` - 定数値
- `public/` - 静的ファイル

### コーディング規約

- TypeScriptの型を適切に使用する
- コンポーネントは機能ごとに分割する
- カスタムフックを使用して状態管理とロジックを分離する
- コメントを適切に記述する
- ESLintとPrettierを使用してコードの品質を維持する

## 今後の開発計画

- [ ] ユーザー認証機能の追加
- [ ] お気に入りの鳥類や場所の保存機能
- [ ] 観測データの統計情報の表示
- [ ] オフライン対応
- [ ] 多言語対応
- [ ] ダークモード対応
- [ ] 鳥類の詳細情報ページの追加
- [ ] ソーシャルシェア機能

## トラブルシューティング

### APIエラー

APIからのデータ取得に失敗した場合、アプリケーションはサンプルデータを使用して動作します。APIエラーが発生した場合は、以下を確認してください：

1. 環境変数`NEXT_PUBLIC_API_URL`が正しく設定されているか
2. APIサーバーが稼働しているか
3. ネットワーク接続に問題がないか

### マップが表示されない

マップが表示されない場合は、以下を確認してください：

1. インターネット接続が有効か
2. ブラウザのJavaScriptが有効か
3. ブラウザのコンソールにエラーメッセージがないか

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- [eBird](https://ebird.org/) - 鳥類観測データの提供
- [Leaflet](https://leafletjs.com/) - インタラクティブマップライブラリ
- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
