import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { clearAuth, setAuthError, setAuthLoading, setAuthUser } from '@/store/slices/authSlice'
import { restoreUser } from '@/features/auth/authService'
import { supabase } from '@/auth/supabaseClient'

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    let active = true
    const restore = async () => {
      if (!supabase) {
        dispatch(clearAuth())
        return
      }
      dispatch(setAuthLoading(true))
      try {
        const user = await restoreUser()
        if (active) {
          if (user) dispatch(setAuthUser(user))
          else dispatch(clearAuth())
        }
      } catch (error) {
        if (active) {
          dispatch(clearAuth())
          dispatch(setAuthError(error instanceof Error ? error.message : 'Unable to restore session.'))
        }
      }
    }
    void restore()

    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (!active) return
      if (event === 'SIGNED_OUT') {
        dispatch(clearAuth())
      }
    })

    return () => {
      active = false
      subscription?.data.subscription.unsubscribe()
    }
  }, [dispatch])

  return children
}
