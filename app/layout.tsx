import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Singapore Bird Observation Map",
  description: "Time-series animation of bird observations in Singapore using eBird API data",
  icons: {
    icon: "/icons/favicon.ico",                    
    shortcut: "/icons/favicon.ico",                  
  },                
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
