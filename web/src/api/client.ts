import axios from 'axios'
import { supabase } from '@/auth/supabaseClient'
import { ApiError, toApiError } from '@/api/errors'

const defaultBaseURL = import.meta.env.PROD
  ? 'https://doctordirect-app.onrender.com/api/v1'
  : 'http://localhost:5001/api/v1'
const baseURL = import.meta.env.VITE_API_BASE_URL || defaultBaseURL

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    const accessToken = data.session?.access_token
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401 && supabase) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) {
        throw new ApiError({
          status: 401,
          code: 'SESSION_CLEAR_FAILED',
          message: `${apiError.message} The local session could not be cleared; sign out and try again.`,
          isNetworkError: false,
        })
      }
    }
    throw apiError
  },
)
