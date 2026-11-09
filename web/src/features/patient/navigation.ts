import { CalendarDays, ClipboardList, Stethoscope, UserRound, LayoutDashboard, Bell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
}

export const patientNavigation: NavigationItem[] = [
  { label: 'Overview', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find a doctor', path: '/patient/doctors', icon: Stethoscope },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: ClipboardList },
  { label: 'My profile', path: '/patient/profile', icon: UserRound },
  { label: 'Notifications', path: '/patient/notifications', icon: Bell },
]
