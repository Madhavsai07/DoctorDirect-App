export type ApiRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface ApiErrorShape {
  status: number | null
  code: string | null
  message: string
  isNetworkError: boolean
}
