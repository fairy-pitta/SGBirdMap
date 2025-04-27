/**
 * アプリケーション設定の型定義
 */
export interface AppConfig {
  // マップの初期設定
  map: {
    center: [number, number] // 初期中心座標 [緯度, 経度]
    zoom: number // 初期ズームレベル
    minZoom: number // 最小ズームレベル
    maxZoom: number // 最大ズームレベル
  }

  // アニメーションの設定
  animation: {
    speed: number // アニメーション速度（ミリ秒）
    increment: number // スライダーの増分
  }

  // APIの設定
  api: {
    baseUrl: string // APIのベースURL
    endpoints: {
      observations: string // 観測データのエンドポイント
      species: string // 種リストのエンドポイント
    }
  }

  // 表示設定
  display: {
    longTermThreshold: number // 長期間表示の閾値（日数）
    maxMarkerSize: number // マーカーの最大サイズ
    minMarkerSize: number // マーカーの最小サイズ
  }
}
