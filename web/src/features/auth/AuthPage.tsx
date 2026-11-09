import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { api } from '@/api/services'
import { supabase } from '@/auth/supabaseClient'
import { signIn, signUp, updatePassword, requestPasswordReset } from '@/features/auth/authService'
import { clearAuth, setAuthUser } from '@/store/slices/authSlice'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  specializationName: z.string().optional(),
  licenseNumber: z.string().optional(),
  experienceYears: z.string().optional(),
  consultationFee: z.string().optional(),
  qualification: z.string().optional(),
  bio: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type Mode = 'login' | 'register' | 'forgot' | 'reset'

export function AuthPage({ title }: { title: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const authenticatedUser = useAppSelector((state) => state.auth.user)
  const bootstrapError = useAppSelector((state) => state.auth.error)
  const [mode, setMode] = useState<Mode>(location.pathname === '/forgot-password' ? 'forgot' : location.pathname.startsWith('/register') ? 'register' : 'login')
  const [role, setRole] = useState<'patient' | 'doctor'>(location.pathname.endsWith('doctor') ? 'doctor' : 'patient')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [requiresIdFile, setRequiresIdFile] = useState(false)
  const [specializations, setSpecializations] = useState<Array<{ id: string; name: string }>>([])
  const [recoverySession, setRecoverySession] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  useEffect(() => {
    if (mode !== 'register' || role !== 'doctor') return
    void api.specializations().then(setSpecializations).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load specializations.')
    })
  }, [mode, role])

  useEffect(() => {
    const client = supabase
    if (!client) return
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoverySession(true)
        setMode('reset')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authenticatedUser) navigate(`/${authenticatedUser.role}/dashboard`, { replace: true })
  }, [authenticatedUser, navigate])

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const password = values.password ?? ''
      if (mode === 'forgot') {
        await requestPasswordReset(values.email)
        setNotice('If an account exists for that email, a password reset link has been sent.')
      } else if (mode === 'reset') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        if (!recoverySession) throw new Error('Open the password reset link from your email first.')
        await updatePassword(password)
        setNotice('Your password has been updated. Sign in with your new password.')
        setRecoverySession(false)
        setMode('login')
        reset({ email: values.email, password: '' })
      } else if (mode === 'login') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        const user = await signIn(values.email, password, requiresIdFile ? file ?? undefined : undefined)
        dispatch(setAuthUser(user))
        navigate(`/${user.role}/dashboard`, { replace: true })
      } else {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        const required = ['firstName', 'lastName'] as const
        for (const field of required) {
          if (!values[field]?.trim()) throw new Error(`${field === 'firstName' ? 'First' : 'Last'} name is required.`)
        }
        const fields: Record<string, unknown> = {
          firstName: values.firstName?.trim(),
          lastName: values.lastName?.trim(),
          phone: values.phone?.trim() || undefined,
        }
        if (role === 'doctor') {
          if (!values.specializationName || !values.licenseNumber || !values.experienceYears || !values.consultationFee || !values.qualification) {
            throw new Error('Complete all required professional fields.')
          }
          if (!file) throw new Error('Upload a JPG or PNG government ID card to apply as a doctor.')
          if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
            throw new Error('Choose a JPG or PNG image that is 10 MB or smaller.')
          }
          fields.specializationName = values.specializationName
          fields.licenseNumber = values.licenseNumber.trim()
          fields.experienceYears = Number(values.experienceYears)
          fields.consultationFee = Number(values.consultationFee)
          fields.qualification = values.qualification.trim()
          fields.bio = values.bio?.trim() || undefined
        }
        const result = await signUp(role, fields, { email: values.email, password }, role === 'doctor' ? file ?? undefined : undefined)
        if (result.confirmationRequired) {
          setNotice('Check your email and confirm the address, then sign in to finish setting up your profile.')
          setMode('login')
          reset({ email: values.email, password: '' })
          return
        }
        if (result.user) {
          dispatch(setAuthUser(result.user))
          navigate(`/${result.user.role}/dashboard`, { replace: true })
        }
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'The request could not be completed.'
      setError(message)
      if (mode === 'login' && message.includes('Upload a JPG or PNG ID card')) setRequiresIdFile(true)
      if (mode === 'login') dispatch(clearAuth())
    } finally {
      setBusy(false)
    }
  })

  if (authenticatedUser) return <Navigate to={`/${authenticatedUser.role}/dashboard`} replace />

  const isRegister = mode === 'register'
  const heading = mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password'

  return (
    <main className="auth-page">
      <div className="auth-page__decor auth-page__decor--one" />
      <div className="auth-page__decor auth-page__decor--two" />
      <div className="auth-frame">
        <aside className="auth-aside">
          <Link className="auth-brand" to="/login">
            <span className="auth-brand__mark"><Activity size={21} /></span>
            <span>Doctor<span>Direct</span></span>
          </Link>
          <div className="auth-aside__content">
            <span className="auth-kicker"><span /> DIGITAL CLINICAL CARE</span>
            <h1>Better care, <em>together.</em></h1>
            <p>A connected space for patients, doctors, and the teams supporting their care.</p>
            <div className="auth-trust">
              <ShieldCheck size={18} />
              <span>Secure access powered by Supabase Auth</span>
            </div>
          </div>
          <div className="auth-aside__footer">DoctorDirect · Connected care for everyone</div>
        </aside>
        <section className="auth-panel">
          <div className="auth-panel__mobile-brand"><Activity size={18} /> DoctorDirect</div>
          <div className="auth-panel__top">
            <span className="auth-context">{isRegister ? 'GET STARTED' : mode === 'login' ? 'YOUR CARE WORKSPACE' : 'ACCOUNT ACCESS'}</span>
            <span className="auth-secure"><ShieldCheck size={15} /> Secure</span>
          </div>
          <div className="auth-heading">
            <h2>{heading}</h2>
            <p>{mode === 'login' ? 'Sign in to continue to your DoctorDirect account.' : mode === 'register' ? 'Choose your account type and enter your details.' : mode === 'forgot' ? 'We’ll email you a secure link to reset your password.' : 'Enter a new password for your account.'}</p>
          </div>
          {(error || bootstrapError) && <ErrorDisplay message={error || bootstrapError || 'Authentication could not be completed.'} />}
          {notice && <div className="auth-notice" role="status">{notice}</div>}
          {mode === 'register' && (
            <div className="auth-role-toggle" role="group" aria-label="Account type">
              {(['patient', 'doctor'] as const).map((option) => (
                <button
                  type="button"
                  key={option}
                  className={role === option ? 'auth-role-toggle__active' : ''}
                  onClick={() => { setRole(option); setError('') }}
                >
                  {option === 'patient' ? 'Patient' : 'Doctor'}
                </button>
              ))}
            </div>
          )}
          <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
            {isRegister && (
              <div className="auth-form__row">
                <label>First name<input {...register('firstName')} autoComplete="given-name" /></label>
                <label>Last name<input {...register('lastName')} autoComplete="family-name" /></label>
              </div>
            )}
            {mode === 'login' && requiresIdFile && (
              <label className="auth-upload">
                <UploadCloud size={18} />
                <span>{file ? file.name : 'Upload your JPG or PNG ID card to finish registration'}</span>
                <input type="file" accept="image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
            )}
            <label>
              Email address
              <input type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
              {errors.email && <small>{errors.email.message}</small>}
            </label>
            {mode !== 'forgot' && (
              <label>
                {mode === 'reset' ? 'New password' : 'Password'}
                <span className="auth-password">
                  <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password')} aria-invalid={Boolean(errors.password)} />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
                {errors.password && <small>{errors.password.message}</small>}
              </label>
            )}
            {isRegister && (
              <>
                <label>Phone number <input type="tel" autoComplete="tel" {...register('phone')} /></label>
                {role === 'doctor' && (
                  <>
                    <label>Medical specialization
                      <select {...register('specializationName')} defaultValue="">
                        <option value="" disabled>Select specialization</option>
                        {specializations.map((specialization) => <option key={specialization.id} value={specialization.name}>{specialization.name}</option>)}
                      </select>
                    </label>
                    <div className="auth-form__row">
                      <label>License number<input {...register('licenseNumber')} /></label>
                      <label>Years of experience<input type="number" min="0" max="70" {...register('experienceYears')} /></label>
                    </div>
                    <div className="auth-form__row">
                      <label>Consultation fee (₹)<input type="number" min="0" max="100000" step="0.01" {...register('consultationFee')} /></label>
                      <label>Qualification<input {...register('qualification')} placeholder="MBBS, MD" /></label>
                    </div>
                    <label>Professional bio <textarea rows={3} {...register('bio')} /></label>
                    <label className="auth-upload">
                      <UploadCloud size={18} />
                      <span>{file ? file.name : 'Upload government ID card (JPG or PNG, up to 10 MB)'}</span>
                      <input type="file" accept="image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                    </label>
                  </>
                )}
              </>
            )}
            {mode === 'login' && <Link className="auth-forgot" to="/forgot-password">Forgot password?</Link>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          {mode === 'login' ? (
            <p className="auth-switch">New to DoctorDirect? <button type="button" onClick={() => { setMode('register'); setError('') }}>Create an account</button></p>
          ) : mode === 'register' ? (
            <p className="auth-switch">Already have an account? <button type="button" onClick={() => { setMode('login'); setError('') }}>Sign in</button></p>
          ) : (
            <Link className="auth-back" to="/login" onClick={() => setMode('login')}><ArrowLeft size={15} /> Back to sign in</Link>
          )}
          <p className="auth-legal">By continuing, you agree to DoctorDirect’s Terms of Service and Privacy Policy.</p>
        </section>
      </div>
      <span className="auth-page__title" aria-hidden="true">{title}</span>
    </main>
  )
}
