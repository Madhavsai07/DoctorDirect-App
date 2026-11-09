import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import type { UserRole } from '@/types/auth'
import { LoadingIndicator } from '@/components/common/LoadingIndicator'

export function ProtectedRoute({ role, allowUnverified = false }: { role: UserRole; allowUnverified?: boolean }) {
  const { status, user, isLoading } = useAppSelector((state) => state.auth)
  const location = useLocation()
  if (isLoading || status === 'uninitialized') {
    return <div className="route-loading"><LoadingIndicator label="Restoring your session" /></div>
  }
  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  if (role === 'doctor' && user.verificationStatus !== 'approved' && !allowUnverified) {
    return <Navigate to="/doctor/verification" replace />
  }
  return <Outlet />
}
