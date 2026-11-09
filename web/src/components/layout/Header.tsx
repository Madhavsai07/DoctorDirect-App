import { Bell, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { signOut } from '@/features/auth/authService'
import { clearAuth } from '@/store/slices/authSlice'

export function Header({ roleLabel }: { roleLabel: string }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [error, setError] = useState('')

  const logout = async () => {
    setError('')
    try {
      await signOut()
      dispatch(clearAuth())
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out.')
    }
  }

  return (
    <header className="app-header">
      <div className="app-header__context">
        <span className="app-header__eyebrow">DOCTORDIRECT / {roleLabel.toUpperCase()}</span>
        <span className="app-header__title">Care workspace</span>
      </div>
      <div className="app-header__actions">
        <Link className="icon-button" to={`/${roleLabel.toLowerCase()}/notifications`} aria-label="Notifications">
          <Bell size={19} />
        </Link>
        <div className="account-summary">
          <span className="account-avatar">{user?.firstName.charAt(0) || roleLabel.charAt(0)}</span>
          <span className="account-button__label">{user ? `${user.firstName} ${user.lastName}` : roleLabel}</span>
        </div>
        <button className="icon-button" type="button" onClick={() => void logout()} aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
      {error && <span className="header-error" role="alert">{error}</span>}
    </header>
  )
}
