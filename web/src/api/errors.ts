import axios from 'axios'
import type { ApiErrorShape } from '@/types/api'

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number | null
  readonly code: string | null
  readonly isNetworkError: boolean

  constructor({ status, code, message, isNetworkError }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.isNetworkError = isNetworkError
  }
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<{ error?: string; code?: string }>(error)) {
    return new ApiError({
      status: null,
      code: null,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      isNetworkError: false,
    })
  }

  if (!error.response) {
    return new ApiError({
      status: null,
      code: null,
      message: 'Unable to reach DoctorDirect. Check your internet connection and try again.',
      isNetworkError: true,
    })
  }

  const { status, data } = error.response
  const fallbackMessage =
    status === 401
      ? 'Your session is not valid. Sign in again to continue.'
      : status === 403
        ? 'You do not have permission to perform this action.'
        : 'The request could not be completed.'

  return new ApiError({
    status,
    code: data?.code ?? null,
    message: data?.error ?? fallbackMessage,
    isNetworkError: false,
  })
}
