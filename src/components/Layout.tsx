import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav />
    </div>
  )
}
