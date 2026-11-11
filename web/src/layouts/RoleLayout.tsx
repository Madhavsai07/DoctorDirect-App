import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { RealtimeNotifications } from '@/features/notifications/RealtimeNotifications'
import type { NavigationItem } from '@/features/patient/navigation'

interface RoleLayoutProps {
  roleLabel: string
  items: NavigationItem[]
}

export function RoleLayout({ roleLabel, items }: RoleLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="workspace">
      <Sidebar
        items={items}
        roleLabel={roleLabel}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="workspace__main">
        <Header roleLabel={roleLabel} />
        <RealtimeNotifications />
        <main className="workspace__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
