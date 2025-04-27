"use client"

import { useState, useEffect } from "react"

// モバイルデバイスを検出するためのカスタムフック
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    // 画面サイズの変更を監視する関数
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024) // md-lg breakpoint
    }

    // 初期チェック
    checkScreenSize()

    // リサイズイベントのリスナーを追加
    window.addEventListener("resize", checkScreenSize)

    // クリーンアップ
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return { isMobile, isTablet }
}
