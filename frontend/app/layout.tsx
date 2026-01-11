import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuickTarot - Tarot com IA',
  description: 'Faça perguntas e receba tiragens de tarot interpretadas por IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
