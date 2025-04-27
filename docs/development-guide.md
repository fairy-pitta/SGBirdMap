# 開発ガイド

このドキュメントでは、シンガポール鳥類観測マップアプリケーションの開発に関するガイドラインを提供します。

## 開発環境のセットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上
- Git

### 開発環境の構築

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

4. 開発サーバーの起動
\`\`\`bash
npm run dev
\`\`\`

## プロジェクト構造

\`\`\`
singapore-bird-map/
├── app/                  # Next.jsのApp Routerページコンポーネント
│   ├── api/              # APIルートハンドラー
│   ├── admin/            # 管理画面
│   └── page.tsx          # メインページ
├── components/           # 再利用可能なReactコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   └── ...               # 機能別コンポーネント
├── hooks/                # カスタムReact Hooks
├── lib/                  # ユーティリティ関数とAPIクライアント
├── types/                # TypeScriptの型定義
├── constants/            # 定数値
├── public/               # 静的ファイル
├── docs/                 # ドキュメント
└── ...                   # その他の設定ファイル
\`\`\`

## コーディング規約

### 命名規則

- **ファイル名**: ケバブケース（例: `bird-observation.ts`）
- **コンポーネント**: パスカルケース（例: `BirdObservation`）
- **関数**: キャメルケース（例: `fetchBirdObservations`）
- **定数**: スネークケース（大文字）（例: `MAX_ZOOM_LEVEL`）
- **型**: パスカルケース（例: `BirdObservation`）

### インポート順序

1. React/Next.js関連のインポート
2. サードパーティライブラリのインポート
3. 自作コンポーネントのインポート
4. フック、ユーティリティ、定数のインポート
5. 型のインポート

### コンポーネント構造

\`\`\`tsx
// 1. インポート
import { useState, useEffect } from "react"
import { SomeLibrary } from "some-library"
import SomeComponent from "@/components/some-component"
import { useSomeHook } from "@/hooks/use-some-hook"
import { SOME_CONSTANT } from "@/constants/some-constant"
import type { SomeType } from "@/types/some-type"

// 2. 型定義
interface ComponentProps {
  prop1: string
  prop2?: number
}

// 3. コンポーネント
export default function Component({ prop1, prop2 = 0 }: ComponentProps) {
  // 3.1. フックと状態
  const [state, setState] = useState(0)
  const { data } = useSomeHook()
  
  // 3.2. 副作用
  useEffect(() => {
    // 副作用のコード
  }, [])
  
  // 3.3. イベントハンドラ
  const handleClick = () => {
    setState(state + 1)
  }
  
  // 3.4. レンダリング
  return (
    <div>
      <h1>{prop1}</h1>
      <p>{prop2}</p>
      <button onClick={handleClick}>Click me</button>
      <SomeComponent />
    </div>
  )
}
\`\`\`

## 状態管理

このアプリケーションでは、React Hooksを使用して状態を管理します。主に以下のフックを使用します：

- `useState`: コンポーネントローカルの状態管理
- `useEffect`: 副作用の処理
- `useCallback`: メモ化されたコールバック関数の作成
- `useMemo`: メモ化された値の計算
- `useRef`: DOMへの参照や再レンダリングをトリガーしない値の保持

複雑な状態管理が必要な場合は、カスタムフックを作成して状態管理のロジックをカプセル化します。

## APIリクエスト

APIリクエストは`lib/api.ts`で定義された関数を使用して行います。これらの関数は、環境変数`NEXT_PUBLIC_API_URL`で設定されたベースURLを使用してAPIエンドポイントにリクエストを送信します。

\`\`\`typescript
import { fetchBirdObservations } from "@/lib/api"

// 使用例
const observations = await fetchBirdObservations("redjun", "2023-01-01", "2023-12-31")
\`\`\`

## エラーハンドリング

APIリクエストのエラーハンドリングは、try-catchブロックを使用して行います。エラーが発生した場合は、ユーザーフレンドリーなエラーメッセージを表示し、可能であればフォールバックデータを使用します。

\`\`\`typescript
try {
  const data = await fetchBirdObservations()
  // データの処理
} catch (error) {
  console.error("Failed to fetch bird observations:", error)
  // エラーメッセージの表示
  // フォールバックデータの使用
}
\`\`\`

## テスト

このアプリケーションでは、Jest、React Testing Library、Cypress（E2Eテスト）を使用してテストを行います。

### ユニットテスト

\`\`\`bash
npm run test
\`\`\`

### E2Eテスト

\`\`\`bash
npm run cypress
\`\`\`

## ビルドとデプロイ

### ビルド

\`\`\`bash
npm run build
\`\`\`

### デプロイ

このアプリケーションは、Vercelにデプロイすることを推奨します。

\`\`\`bash
npm run deploy
\`\`\`

## 貢献ガイドライン

1. 新しい機能やバグ修正のためのブランチを作成します。
2. コードを変更し、適切なテストを追加します。
3. すべてのテストが通過することを確認します。
4. プルリクエストを作成します。
5. コードレビューを受け、必要に応じて変更を加えます。
6. マージされたら、ブランチを削除します。

## ヘルプとサポート

開発中に問題が発生した場合は、以下のリソースを参照してください：

- [GitHub Issues](https://github.com/yourusername/singapore-bird-map/issues)
- [プロジェクトWiki](https://github.com/yourusername/singapore-bird-map/wiki)
- [開発者チャット](https://discord.gg/example)
