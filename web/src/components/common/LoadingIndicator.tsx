export function LoadingIndicator({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="loading-indicator" role="status">
      <span className="loading-indicator__spinner" aria-hidden="true" />
      {label}
    </span>
  )
}
