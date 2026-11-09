import { AlertCircle } from 'lucide-react'

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="feedback feedback--error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
