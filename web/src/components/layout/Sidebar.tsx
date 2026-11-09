import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { NavigationItem } from '@/features/patient/navigation'
import { BrandMark } from '@/components/common/BrandMark'

interface SidebarProps {
  items: NavigationItem[]
  roleLabel: string
  open: boolean
  onToggle: () => void
  onClose: () => void
}

export function Sidebar({ items, roleLabel, open, onToggle, onClose }: SidebarProps) {
  return (
    <>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <BrandMark />
          <span>DoctorDirect</span>
        </div>
        <div className="sidebar__role">{roleLabel} workspace</div>
        <nav className="sidebar__nav" aria-label={`${roleLabel} navigation`}>
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
              onClick={onClose}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <span className="status-dot" />
          Secure care workspace
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
    </>
  )
}
