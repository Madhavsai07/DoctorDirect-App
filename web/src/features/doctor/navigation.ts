import { Bell, CalendarDays, ClipboardList, LayoutDashboard, UserRound } from 'lucide-react'
import type { NavigationItem } from '@/features/patient/navigation'

export const doctorNavigation: NavigationItem[] = [
  { label: 'Overview', path: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
  { label: 'Schedule', path: '/doctor/schedule', icon: CalendarDays },
  { label: 'Prescriptions', path: '/doctor/prescriptions', icon: ClipboardList },
  { label: 'My profile', path: '/doctor/profile', icon: UserRound },
  { label: 'Notifications', path: '/doctor/notifications', icon: Bell },
]
