import { BadgeCheck, Bell, LayoutDashboard, Stethoscope } from 'lucide-react'
import type { NavigationItem } from '@/features/patient/navigation'

export const adminNavigation: NavigationItem[] = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctor verification', path: '/admin/doctor-verification', icon: BadgeCheck },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
]
