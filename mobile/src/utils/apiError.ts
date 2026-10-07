interface ApiErrorShape {
  message?: string;
  response?: {
    status?: number;
    data?: { error?: string; message?: string; code?: string };
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorShape;
  const status = apiError?.response?.status;
  const code = apiError?.response?.data?.code;
  const serverMessage = apiError?.response?.data?.error ?? apiError?.response?.data?.message;
  const normalized = serverMessage?.toLowerCase() ?? '';

  if (code === 'DOCTOR_NOT_VERIFIED' || normalized.includes('not yet verified')) {
    return 'This doctor account is awaiting verification and cannot perform this action yet.';
  }
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested information could not be found.';
  if (status === 409 || normalized.includes('slot is not available') || normalized.includes('already booked')) {
    return normalized.includes('email') || normalized.includes('account')
      ? 'An account with this email already exists. Please sign in instead.'
      : 'This item has changed or is no longer available. Refresh and try again.';
  }
  if (status === 422) return serverMessage ?? 'Check the information entered and try again.';
  if (status && status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
  if (serverMessage && status && status < 500) return serverMessage;

  const message = apiError?.message?.toLowerCase() ?? '';
  if (message.includes('network error') || message.includes('timeout') || message.includes('fetch')) {
    return 'Unable to connect. Check your internet connection and try again.';
  }
  return fallback;
}
