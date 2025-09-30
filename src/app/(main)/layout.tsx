'use client'

import { Header } from '@/components/layout/header'
import { PWAInstaller } from '@/components/ui/pwa-installer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <PWAInstaller />
    </div>
  )
}