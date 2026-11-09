import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
}

export function FormField({ id, label, error, hint, ...inputProps }: FormFieldProps) {
  const inputId = id ?? inputProps.name
  const errorId = error && inputId ? `${inputId}-error` : undefined

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...inputProps}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
      />
      {error ? (
        <span className="form-field__error" id={errorId}>
          {error}
        </span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
