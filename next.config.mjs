/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages へ静的書き出しで載せるため。APIルート・server action が
  // 無く、データ取得は全てクライアント側の Supabase 呼び出しなので export できる。
  output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
