import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthStatus, AuthUser } from '@/types/auth'

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  error: string | null
  isLoading: boolean
}

const initialState: AuthState = {
  status: 'uninitialized',
  user: null,
  error: null,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthUser>) {
      state.status = 'authenticated'
      state.user = action.payload
      state.error = null
      state.isLoading = false
    },
    clearAuth(state) {
      state.status = 'unauthenticated'
      state.user = null
      state.error = null
      state.isLoading = false
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    resetAuthInitialization(state) {
      state.status = 'uninitialized'
      state.user = null
      state.error = null
      state.isLoading = true
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const {
  setAuthUser,
  clearAuth,
  setAuthError,
  resetAuthInitialization,
  setAuthLoading,
} = authSlice.actions
export default authSlice.reducer
