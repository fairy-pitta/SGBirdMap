// シンガポールの中心座標
export const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198]

// デフォルトのズームレベル
export const DEFAULT_ZOOM = 12

// 長期間表示の閾値（日数）
export const LONG_TERM_THRESHOLD = 30

// アニメーション速度（ミリ秒）
export const ANIMATION_SPEED = 300

// スライダーの増分（1回の更新でどれだけ進むか）
export const SLIDER_INCREMENT = 0.5

// アクティブな観測マーカーのスタイル
export const ACTIVE_MARKER_STYLE = {
  color: "#ffffff",
  weight: 2,
  opacity: 1,
  fillOpacity: 0.6,
  fillColor: "#dc2626", // red-600
}

// 永続的なマーカー（点）のスタイル
export const PERSISTENT_MARKER_STYLE = {
  radius: 3,
  color: "#dc2626", // red-600
  weight: 1,
  opacity: 0.8,
  fillColor: "#dc2626", // red-600
  fillOpacity: 0.8,
}

// アニメーションのCSS
export const ANIMATION_CSS = `
  /* パルスアニメーション */
  .pulse-circle {
    animation: pulse 6s ease-out;
    animation-iteration-count: infinite;
  }
  
  @keyframes pulse {
    0% {
      opacity: 0.7;
      transform: scale(0.3);
    }
    50% {
      opacity: 0.4;
      transform: scale(2);
    }
    100% {
      opacity: 0;
      transform: scale(3);
    }
  }

  /* 出現アニメーション - 小さいサイズから拡大（さらにゆっくり） */
  .observation-marker {
    animation: appear 5s cubic-bezier(0.07, 0.25, 0.25, 1) forwards;
    transform-origin: center center;
  }
  
  @keyframes appear {
    0% {
      opacity: 0;
      transform: scale(0.1);
    }
    20% {
      opacity: 0.3;
      transform: scale(0.3);
    }
    50% {
      opacity: 0.7;
      transform: scale(0.6);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* フェードアウトアニメーション（ゆっくり） */
  .observation-marker.fade-out {
    animation: fadeOut 3s ease-out forwards;
  }
  
  @keyframes fadeOut {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    30% {
      opacity: 0.7;
      transform: scale(1.05);
    }
    70% {
      opacity: 0.3;
      transform: scale(1.15);
    }
    100% {
      opacity: 0;
      transform: scale(1.2);
    }
  }
`
