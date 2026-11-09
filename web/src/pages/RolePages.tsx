import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Check, Clock3, FileText, RefreshCw, Search, Stethoscope, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, type AdminDoctor, type Appointment, type AvailabilityWindow, type Consultation, type Doctor, type NotificationItem, type Prescription, type ScheduleOverride, type ScheduleSlot, type Slot } from '@/api/services'
import { ApiError } from '@/api/errors'
import { useAppSelector } from '@/app/hooks'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { LoadingIndicator } from '@/components/common/LoadingIndicator'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'

const appointmentStatusLabel: Record<string, string> = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  no_show: 'No show',
}

const scheduleReferenceTime = Date.now()

function localDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateRange(days = 30) {
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + days - 1)
  return { from: localDate(from), to: localDate(to) }
}

function readableTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  )
}

function PageNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="page-error">
      <ErrorDisplay message={message} />
      {onRetry && <button className="button button--secondary" type="button" onClick={onRetry}>Try again</button>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone = ['confirmed', 'completed', 'approved'].includes(status)
    ? 'success'
    : ['cancelled', 'rejected', 'no_show'].includes(status)
      ? 'error'
      : ['in_progress'].includes(status)
        ? 'info'
        : 'warning'
  return <span className={`status-badge status-badge--${tone}`}>{appointmentStatusLabel[status] ?? status}</span>
}

function MetricCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof CalendarDays }) {
  return (
    <div className="metric-card">
      <div className="metric-card__top"><span>{label}</span><Icon size={18} /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function AppointmentCard({
  appointment,
  kind,
  onChanged,
  onCancel,
  onConsult,
  onReschedule,
}: {
  appointment: Appointment
  kind: 'patient' | 'doctor'
  onChanged: () => void
  onCancel?: (appointment: Appointment) => void
  onConsult?: (appointment: Appointment) => void
  onReschedule?: (appointment: Appointment) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const person = kind === 'patient'
    ? `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`
    : `${appointment.patient_first_name} ${appointment.patient_last_name}`
  const canCancel = ['booked', 'confirmed'].includes(appointment.status)

  const action = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await operation()
      onChanged()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update appointment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="data-card appointment-card">
      <div className="data-card__main">
        <div className="data-card__avatar"><UserRound size={20} /></div>
        <div className="data-card__body">
          <div className="data-card__title-row"><h3>{person}</h3><StatusBadge status={appointment.status} /></div>
          <p className="data-card__meta appointment-card__schedule">
            <span><CalendarDays size={14} />{new Date(`${appointment.slot_date}T12:00:00`).toLocaleDateString()}</span>
            <span><Clock3 size={14} />{readableTime(appointment.slot_start_time)}</span>
            {appointment.reason_for_visit && <span>Reason: {appointment.reason_for_visit}</span>}
          </p>
          {kind === 'doctor' && (
            <p className="data-card__detail">
              {appointment.patient_email}
              {appointment.patient_phone ? ` · ${appointment.patient_phone}` : ''}
              {appointment.patient_allergies ? ` · Allergies: ${appointment.patient_allergies}` : ''}
            </p>
          )}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>
      </div>
      <div className="data-card__actions">
        {kind === 'patient' && canCancel && (
          <>
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => onReschedule?.(appointment)}>Reschedule</button>
            <button type="button" className="button button--danger-ghost" disabled={busy} onClick={() => onCancel ? onCancel(appointment) : void action(() => api.cancelAppointment(appointment.id))}>Cancel</button>
          </>
        )}
        {kind === 'patient' && appointment.status === 'completed' && onConsult && (
          <button type="button" className="button button--secondary" onClick={() => onConsult(appointment)}>View consultation</button>
        )}
        {kind === 'doctor' && appointment.status === 'booked' && (
          <button type="button" className="button button--secondary" disabled={busy} onClick={() => void action(() => api.confirmAppointment(appointment.id))}>Confirm</button>
        )}
        {kind === 'doctor' && ['confirmed', 'in_progress', 'completed'].includes(appointment.status) && (
          <button type="button" className="button button--primary" disabled={busy} onClick={() => onConsult?.(appointment)}>
            {appointment.status === 'completed' ? 'View consultation' : appointment.status === 'in_progress' ? 'Open consultation' : 'Start consultation'}
          </button>
        )}
        {kind === 'doctor' && ['confirmed', 'booked'].includes(appointment.status) && (
          <button type="button" className="button button--danger-ghost" disabled={busy} onClick={() => void action(() => api.cancelAppointment(appointment.id))}>Cancel</button>
        )}
      </div>
    </article>
  )
}

export function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setAppointments(await api.appointments('patient')) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load appointments.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const upcoming = appointments.filter((item) => ['booked', 'confirmed', 'in_progress'].includes(item.status))
  return (
    <section className="page-content">
      <PageHeading eyebrow="PATIENT WORKSPACE" title="Your care overview" description="Keep up with appointments and your ongoing care." />
      <div className="metrics-grid">
        <MetricCard label="Upcoming visits" value={upcoming.length} note="Appointments to prepare for" icon={CalendarDays} />
        <MetricCard label="Completed visits" value={appointments.filter((item) => item.status === 'completed').length} note="Your care history" icon={Check} />
      </div>
      <div className="section-title"><h2>Next appointments</h2><button className="text-button" type="button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
      {error && <PageNotice message={error} onRetry={() => void load()} />}
      {loading ? <LoadingIndicator label="Loading your appointments" /> : upcoming.length ? upcoming.slice(0, 3).map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} kind="patient" onChanged={() => void load()} />) : <EmptyState title="No upcoming appointments" description="Explore the doctor directory to find care that’s right for you." />}
    </section>
  )
}

export function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specializations, setSpecializations] = useState<Array<{ id: string; name: string }>>([])
  const [search, setSearch] = useState('')
  const [specializationId, setSpecializationId] = useState('')
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDoctors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, categories] = await Promise.all([
        api.doctors({ search: search || undefined, specialization_id: specializationId || undefined }),
        api.specializations(),
      ])
      setDoctors(list)
      setSpecializations(categories)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load doctors.')
    } finally { setLoading(false) }
  }, [search, specializationId])
  useEffect(() => { const timer = setTimeout(() => void loadDoctors(), 300); return () => clearTimeout(timer) }, [loadDoctors])

  const selectDoctor = async (doctor: Doctor) => {
    setSelected(doctor)
    setSlots([])
    setSelectedDate('')
    setSelectedSlot(null)
    setReason('')
    setBookingError('')
    setAvailabilityLoading(true)
    const range = dateRange(14)
    try {
      const availableSlots = await api.doctorSlots(doctor.doctor_id, range.from, range.to)
      setSlots(availableSlots)
      const firstAvailableDate = availableSlots
        .filter((slot) => slot.status === 'available')
        .map((slot) => slot.date)
        .sort()[0]
      if (firstAvailableDate) setSelectedDate(firstAvailableDate)
    } catch (requestError) {
      setBookingError(requestError instanceof Error ? requestError.message : 'Unable to load availability.')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const book = async () => {
    if (!selectedSlot) return
    setBooking(true)
    setBookingError('')
    setSuccess('')
    try {
      await api.bookAppointment(selectedSlot.id, reason)
      setSuccess(`Appointment booked with Dr. ${selected?.first_name} ${selected?.last_name}.`)
      setSelected(null)
      setSelectedSlot(null)
      setSelectedDate('')
      setReason('')
      setSlots([])
    } catch (requestError) {
      setBookingError(requestError instanceof Error ? requestError.message : 'Unable to book this slot.')
    } finally {
      setBooking(false)
    }
  }
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((grouped, slot) => {
    if (slot.status === 'available') (grouped[slot.date] ??= []).push(slot)
    return grouped
  }, {})
  const availableDates = Object.keys(slotsByDate).sort()
  const selectedDateSlots = slotsByDate[selectedDate] ?? []

  return (
    <section className="page-content">
      <PageHeading eyebrow="PATIENT WORKSPACE" title="Find a doctor" description="Browse approved specialists and book available appointments." />
      <div className="directory-tools">
        <label className="search-field"><Search size={17} /><input placeholder="Search doctors or specialties" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select value={specializationId} onChange={(event) => setSpecializationId(event.target.value)} aria-label="Filter by specialization">
          <option value="">All specializations</option>
          {specializations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
      </div>
      {success && <div className="success-message" role="status">{success}</div>}
      {error && <PageNotice message={error} onRetry={() => void loadDoctors()} />}
      {loading ? <LoadingIndicator label="Finding available doctors" /> : (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor.doctor_id}>
              <div className="doctor-card__head">
                <span className="doctor-avatar">{doctor.first_name.charAt(0)}{doctor.last_name.charAt(0)}</span>
                <span className="rating">★ {Number(doctor.rating || 0).toFixed(1)}</span>
              </div>
              <h3>Dr. {doctor.first_name} {doctor.last_name}</h3>
              <span className="doctor-card__specialty">{doctor.specialization_name}</span>
              <p>{doctor.qualification || `${doctor.experience_years} years of experience`}</p>
              {doctor.bio && <p className="doctor-card__bio">{doctor.bio}</p>}
              <div className="doctor-card__footer">
                <strong>₹{Number(doctor.consultation_fee).toLocaleString('en-IN')}</strong>
                <button className="button button--primary" type="button" onClick={() => void selectDoctor(doctor)}>View availability</button>
              </div>
            </article>
          ))}
          {!doctors.length && <EmptyState title="No doctors found" description="Try a different search or specialization." />}
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => !booking && setSelected(null)}>
          <section className="workflow-modal booking-modal" role="dialog" aria-modal="true" aria-labelledby="book-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close" disabled={booking} onClick={() => setSelected(null)}><X size={19} /></button>
            <span className="eyebrow">{selectedSlot ? 'CONFIRM YOUR VISIT' : 'BOOK AN APPOINTMENT'}</span>
            <h2 id="book-title">{selectedSlot ? 'Confirm appointment' : `Dr. ${selected.first_name} ${selected.last_name}`}</h2>
            <p>{selected.specialization_name} · ₹{Number(selected.consultation_fee).toLocaleString('en-IN')} consultation fee</p>
            {bookingError && <ErrorDisplay message={bookingError} />}
            {selectedSlot ? (
              <>
                <div className="booking-summary">
                  <div><UserRound size={18} /><span><strong>Dr. {selected.first_name} {selected.last_name}</strong><small>{selected.specialization_name}</small></span></div>
                  <div><CalendarDays size={18} /><span><strong>{new Date(`${selectedSlot.date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><small>{readableTime(selectedSlot.start_time)} – {readableTime(selectedSlot.end_time)}</small></span></div>
                  <div><span className="booking-summary__currency">₹</span><span><strong>₹{Number(selected.consultation_fee).toLocaleString('en-IN')}</strong><small>Consultation fee</small></span></div>
                </div>
                <label className="field-label">Reason for visit (optional)<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} placeholder="e.g. Fever, follow-up, routine checkup" /></label>
                <div className="booking-actions">
                  <button className="button button--secondary" type="button" disabled={booking} onClick={() => setSelectedSlot(null)}>Choose another time</button>
                  <button className="button button--primary" type="button" disabled={booking} onClick={() => void book()}>{booking ? 'Booking…' : 'Confirm booking'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="booking-step-heading">
                  <h3>Choose a date</h3>
                  <span>Availability for the next 14 days</span>
                </div>
                {availabilityLoading ? <LoadingIndicator label="Checking date availability" /> : availableDates.length ? (
                  <>
                    <div className="booking-date-list" aria-label="Available dates">
                      {availableDates.map((date) => {
                        const dateValue = new Date(`${date}T12:00:00`)
                        const active = date === selectedDate
                        return <button
                          className={`booking-date${active ? ' booking-date--selected' : ''}`}
                          type="button"
                          key={date}
                          aria-pressed={active}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span>{dateValue.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                          <strong>{dateValue.toLocaleDateString('en-IN', { day: 'numeric' })}</strong>
                          <span>{dateValue.toLocaleDateString('en-IN', { month: 'short' })}</span>
                          <small>{slotsByDate[date].length} {slotsByDate[date].length === 1 ? 'time' : 'times'}</small>
                        </button>
                      })}
                    </div>
                    <div className="booking-time-section">
                      <h3>Available times</h3>
                      <span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="slots-grid">
                      {selectedDateSlots.map((slot) => (
                        <button className="slot-button" type="button" key={slot.id} onClick={() => { setSelectedSlot(slot); setBookingError('') }}>
                          <Clock3 size={16} /><strong>{readableTime(slot.start_time)}</strong>
                        </button>
                      ))}
                      {!selectedDateSlots.length && <p className="muted-copy">No available times for this date. Choose another date.</p>}
                    </div>
                  </>
                ) : <EmptyState title="No available dates" description="This doctor has no bookable times in the next 14 days. Try another doctor." />}
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moving, setMoving] = useState<Appointment | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [viewingConsultation, setViewingConsultation] = useState<Appointment | null>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [consultationLoading, setConsultationLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const load = useCallback(async () => {
    setError('')
    try { setAppointments(await api.appointments('patient')) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load appointments.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const startReschedule = async (appointment: Appointment) => {
    setMoving(appointment)
    setError('')
    const range = dateRange(30)
    try {
      const available = await api.doctorSlots(appointment.doctor_id, range.from, range.to)
      setSlots(available.filter((slot) => slot.status === 'available' && slot.id !== appointment.slot_id))
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load new times.') }
  }
  const reschedule = async (slotId: string) => {
    if (!moving) return
    try {
      await api.rescheduleAppointment(moving.id, slotId)
      setMoving(null)
      await load()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to reschedule.') }
  }
  const viewConsultation = async (appointment: Appointment) => {
    setViewingConsultation(appointment)
    setConsultation(null)
    setConsultationLoading(true)
    setError('')
    try { setConsultation(await api.consultation(appointment.id)) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load consultation.') }
    finally { setConsultationLoading(false) }
  }
  const cancelAppointment = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      await api.cancelAppointment(cancelTarget.id, cancelReason.trim() || undefined)
      setCancelTarget(null)
      setCancelReason('')
      await load()
    } catch (requestError) {
      setCancelError(requestError instanceof Error ? requestError.message : 'Unable to cancel appointment.')
    } finally {
      setCancelling(false)
    }
  }
  const upcoming = appointments.filter((item) =>
    new Date(`${item.slot_date}T${item.slot_start_time}`).getTime() >= scheduleReferenceTime &&
    !['cancelled', 'completed'].includes(item.status)
  )
  const past = appointments.filter((item) =>
    new Date(`${item.slot_date}T${item.slot_start_time}`).getTime() < scheduleReferenceTime ||
    ['cancelled', 'completed'].includes(item.status)
  )
  const displayedAppointments = activeTab === 'upcoming' ? upcoming : past

  return (
    <section className="page-content">
      <PageHeading eyebrow="PATIENT WORKSPACE" title="Appointments" description="Review, cancel, or reschedule your visits." />
      <div className="appointments-toolbar"><div className="appointment-tabs" role="tablist" aria-label="Appointment period">
        <button type="button" role="tab" aria-selected={activeTab === 'upcoming'} className={activeTab === 'upcoming' ? 'appointment-tab appointment-tab--active' : 'appointment-tab'} onClick={() => setActiveTab('upcoming')}>Upcoming ({upcoming.length})</button>
        <button type="button" role="tab" aria-selected={activeTab === 'past'} className={activeTab === 'past' ? 'appointment-tab appointment-tab--active' : 'appointment-tab'} onClick={() => setActiveTab('past')}>Past ({past.length})</button>
      </div><button className="text-button" type="button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
      {error && <PageNotice message={error} />}
      {loading ? <LoadingIndicator label="Loading appointments" /> : displayedAppointments.length ? displayedAppointments.map((item) => <AppointmentCard key={item.id} appointment={item} kind="patient" onChanged={() => void load()} onCancel={(value) => { setCancelTarget(value); setCancelReason(''); setCancelError('') }} onReschedule={(value) => void startReschedule(value)} onConsult={(value) => void viewConsultation(value)} />) : <EmptyState title={activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'} description={activeTab === 'upcoming' ? 'Browse doctors and book your first appointment.' : 'Completed and cancelled appointments will appear here.'} />}
      {moving && <div className="modal-backdrop" role="presentation" onClick={() => setMoving(null)}><section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="reschedule-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close" onClick={() => setMoving(null)}><X size={19} /></button>
        <span className="eyebrow">RESCHEDULE VISIT</span><h2 id="reschedule-title">Choose a new time</h2>
        <div className="slots-grid">{slots.map((slot) => <button className="slot-button" type="button" key={slot.id} onClick={() => void reschedule(slot.id)}><strong>{new Date(`${slot.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong><span>{readableTime(slot.start_time)}</span></button>)}</div>
        {!slots.length && <p className="muted-copy">No available replacement slots were found in the next 30 days.</p>}
      </section></div>}
      {viewingConsultation && <div className="modal-backdrop" role="presentation" onClick={() => setViewingConsultation(null)}>
        <section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="patient-consult-title" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" aria-label="Close" onClick={() => setViewingConsultation(null)}><X size={19} /></button>
          <span className="eyebrow">CONSULTATION · DR. {viewingConsultation.doctor_first_name} {viewingConsultation.doctor_last_name}</span>
          <h2 id="patient-consult-title">Visit notes</h2>
          {consultationLoading ? <LoadingIndicator label="Loading consultation notes" /> : consultation ? <dl className="detail-list detail-list--single">
            <div><dt>Symptoms</dt><dd>{consultation.symptoms || 'Not recorded'}</dd></div>
            <div><dt>Diagnosis</dt><dd>{consultation.diagnosis || 'Not recorded'}</dd></div>
            <div><dt>Clinical notes</dt><dd>{consultation.clinical_notes || 'Not recorded'}</dd></div>
            <div><dt>Treatment plan</dt><dd>{consultation.treatment_plan || 'Not recorded'}</dd></div>
            <div><dt>Follow-up instructions</dt><dd>{consultation.follow_up_instructions || 'Not recorded'}</dd></div>
          </dl> : <PageNotice message={error || 'No consultation details are available.'} />}
        </section>
      </div>}
      {cancelTarget && <div className="modal-backdrop" role="presentation" onClick={() => !cancelling && setCancelTarget(null)}>
        <section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-appointment-title" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" aria-label="Close" disabled={cancelling} onClick={() => setCancelTarget(null)}><X size={19} /></button>
          <span className="eyebrow">APPOINTMENT CHANGE</span>
          <h2 id="cancel-appointment-title">Cancel appointment?</h2>
          <p>Cancel your appointment with Dr. {cancelTarget.doctor_first_name} {cancelTarget.doctor_last_name}? The slot will be released for other patients.</p>
          <label className="field-label">Reason (optional)<textarea rows={3} maxLength={200} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Schedule conflict, feeling better…" /></label>
          {cancelError && <PageNotice message={cancelError} />}
          <div className="modal-actions"><button className="button button--secondary" type="button" disabled={cancelling} onClick={() => setCancelTarget(null)}>Keep appointment</button><button className="button button--danger-ghost" type="button" disabled={cancelling} onClick={() => void cancelAppointment()}>{cancelling ? 'Cancelling…' : 'Yes, cancel'}</button></div>
        </section>
      </div>}
    </section>
  )
}

export function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setPrescriptions(await api.patientPrescriptions()) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load prescriptions.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  return (
    <section className="page-content">
      <PageHeading eyebrow="PATIENT WORKSPACE" title="Prescriptions" description="Your signed prescriptions from completed consultations." />
      {error && <PageNotice message={error} onRetry={() => void load()} />}
      {loading ? <LoadingIndicator label="Loading prescriptions" /> : prescriptions.length ? prescriptions.map((item) => {
        const medicines = Array.isArray(item.medicines) ? item.medicines : []
        return <article className="data-card prescription-card" key={item.id}>
          <div className="data-card__main"><div className="data-card__avatar"><FileText size={20} /></div><div className="data-card__body">
            <div className="data-card__title-row"><h3>{item.diagnosis}</h3><StatusBadge status="completed" /></div>
            <p className="data-card__meta">Dr. {item.doctor_first_name} {item.doctor_last_name} · {item.specialization_name ?? 'Doctor'}{item.slot_date ? ` · ${new Date(`${item.slot_date}T12:00:00`).toLocaleDateString()}` : ''}</p>
            <ul className="medicine-list">{medicines.map((medicine, index) => <li key={`${medicine.name}-${index}`}><strong>{medicine.name}</strong> — {medicine.dosage}, {medicine.frequency}, {medicine.duration}{medicine.instructions ? ` · ${medicine.instructions}` : ''}</li>)}</ul>
            {item.general_advice && <p className="data-card__detail">Advice: {item.general_advice}</p>}
          </div></div>
        </article>
      }) : <EmptyState title="No signed prescriptions" description="Signed prescriptions from your visits will appear here." />}
    </section>
  )
}

export function ProfilePage({ kind }: { kind: 'patient' | 'doctor' | 'admin' }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = useAppSelector((state) => state.auth.user)
  const load = useCallback(async () => {
    try {
      const response = kind === 'patient' ? await api.patientProfile() : kind === 'doctor' ? await api.doctorProfile() : await api.currentUser()
      setData(response.user)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load profile.') }
    finally { setLoading(false) }
  }, [kind])
  useEffect(() => { void load() }, [load])
  return <section className="page-content">
    <PageHeading eyebrow={`${kind.toUpperCase()} WORKSPACE`} title="My profile" description="Your account details are provided by DoctorDirect." />
    {error && <PageNotice message={error} onRetry={() => void load()} />}
    {loading ? <LoadingIndicator label="Loading profile" /> : <article className="profile-card">
      <span className="profile-card__avatar">{(user?.firstName[0] ?? 'U')}{(user?.lastName[0] ?? '')}</span>
      <div className="profile-card__details">
        <div className="profile-card__identity">
          <h2>{String(data?.first_name ?? user?.firstName ?? '')} {String(data?.last_name ?? user?.lastName ?? '')}</h2>
          <span className={`role-chip role-chip--${kind}`}>{kind}</span>
        </div>
        <dl>
          <div><dt>Email</dt><dd>{String(data?.email ?? user?.email ?? '')}</dd></div>
          <div><dt>Phone</dt><dd>{String(data?.phone ?? 'Not provided')}</dd></div>
          {kind === 'doctor' && user?.verificationStatus && <div><dt>Verification</dt><dd><StatusBadge status={user.verificationStatus} /></dd></div>}
        </dl>
        <p className="muted-copy">Profile editing is not currently exposed by the existing backend API.</p>
      </div>
    </article>}
  </section>
}

export function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setAppointments(await api.appointments('doctor')) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load appointments.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const active = appointments.filter((item) => ['booked', 'confirmed', 'in_progress'].includes(item.status))
  return <section className="page-content">
    <PageHeading eyebrow="DOCTOR WORKSPACE" title="Practice overview" description="Manage your schedule and patient appointments." />
    <div className="metrics-grid">
      <MetricCard label="Upcoming visits" value={active.length} note="Waiting or confirmed" icon={CalendarDays} />
      <MetricCard label="Completed" value={appointments.filter((item) => item.status === 'completed').length} note="Completed consultations" icon={Check} />
    </div>
    {error && <PageNotice message={error} onRetry={() => void load()} />}
    {loading ? <LoadingIndicator label="Loading practice overview" /> : active.slice(0, 4).map((item) => <AppointmentCard key={item.id} appointment={item} kind="doctor" onChanged={() => void load()} />)}
    {!loading && !active.length && <EmptyState title="No upcoming appointments" description="New bookings will appear here." />}
  </section>
}

export function DoctorAppointmentsPage({ focus = 'appointments' }: { focus?: 'appointments' | 'prescriptions' }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentView, setAppointmentView] = useState<'all' | 'active' | 'cancelled' | 'history'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [consultation, setConsultation] = useState<{ id: string; diagnosis: string; symptoms: string; clinical_notes: string; treatment_plan: string; follow_up_instructions: string } | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setError('')
    try { setAppointments(await api.appointments('doctor')) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load appointments.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const openConsultation = async (appointment: Appointment) => {
    setSelected(appointment)
    setError('')
    setPrescription(null)
    try {
      let existing
      try { existing = await api.consultation(appointment.id) }
      catch (requestError) {
        if (!(requestError instanceof ApiError && requestError.status === 404)) throw requestError
        existing = await api.startConsultation(appointment.id)
      }
      const activeConsultation = {
        id: existing.id,
        diagnosis: existing.diagnosis ?? '',
        symptoms: existing.symptoms ?? '',
        clinical_notes: existing.clinical_notes ?? '',
        treatment_plan: existing.treatment_plan ?? '',
        follow_up_instructions: existing.follow_up_instructions ?? '',
      }
      setConsultation(activeConsultation)
      if (existing.status === 'completed') {
        try { setPrescription(await api.prescriptionsForConsultation(existing.id)) }
        catch (requestError) { if (!(requestError instanceof ApiError && requestError.status === 404)) throw requestError }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to open consultation.')
    }
  }

  const saveConsultation = async (complete: boolean) => {
    if (!consultation) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        symptoms: consultation.symptoms,
        diagnosis: consultation.diagnosis,
        clinical_notes: consultation.clinical_notes,
        treatment_plan: consultation.treatment_plan,
        follow_up_instructions: consultation.follow_up_instructions,
      }
      if (complete) await api.completeConsultation(consultation.id, payload)
      else await api.updateConsultation(consultation.id, payload)
      if (complete && selected) {
        setSelected({ ...selected, status: 'completed' })
        await load()
      }
      if (complete) setNotice('Consultation completed. You can now create a prescription.')
      else setNotice('Consultation draft saved.')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to save consultation.') }
    finally { setSaving(false) }
  }
  const [notice, setNotice] = useState('')
  const activeAppointments = appointments.filter((item) => ['booked', 'confirmed', 'in_progress'].includes(item.status))
  const cancelledAppointments = appointments.filter((item) => item.status === 'cancelled')
  const historyAppointments = appointments.filter((item) =>
    !['booked', 'confirmed', 'in_progress', 'cancelled'].includes(item.status)
  )
  const visibleAppointments = focus === 'prescriptions'
    ? appointments.filter((item) => item.status === 'completed')
    : appointmentView === 'all'
      ? appointments
      : appointmentView === 'active'
      ? activeAppointments
      : appointmentView === 'cancelled'
        ? cancelledAppointments
      : appointmentView === 'history'
        ? historyAppointments
        : []

  const createPrescription = async () => {
    if (!consultation) return
    if (medicines.some((item) => !item.name.trim() || !item.dosage.trim() || !item.frequency.trim() || !item.duration.trim())) {
      setError('Complete the medicine name, dosage, frequency, and duration.')
      return
    }
    setSaving(true)
    try {
      setPrescription(await api.createPrescription({
        consultationId: consultation.id,
        diagnosis: consultation.diagnosis,
        medicines,
      }))
      setNotice('Prescription draft saved.')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to create prescription.') }
    finally { setSaving(false) }
  }
  const finalizePrescription = async () => {
    if (!prescription) return
    setSaving(true)
    try {
      await api.finalizePrescription(prescription.id)
      setPrescription({ ...prescription, is_signed: true })
      setNotice('Prescription finalized and signed.')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to finalize prescription.') }
    finally { setSaving(false) }
  }

  return <section className="page-content">
    <PageHeading
      eyebrow="DOCTOR WORKSPACE"
      title={focus === 'prescriptions' ? 'Prescriptions' : 'Appointments'}
      description={focus === 'prescriptions'
        ? 'Choose a completed visit to review its consultation and create or finalize a prescription.'
        : 'Confirm bookings and document consultations for your patients.'}
    />
    <div className="appointments-toolbar">
      {focus === 'prescriptions'
        ? <h2 className="appointments-toolbar__title">Completed visits ({visibleAppointments.length})</h2>
        : <div className="appointment-tabs" role="tablist" aria-label="Filter appointments">
          {([
            ['active', `Active (${activeAppointments.length})`],
            ['cancelled', `Canceled (${cancelledAppointments.length})`],
            ['history', `History (${historyAppointments.length})`],
            ['all', `All (${appointments.length})`],
          ] as const).map(([view, label]) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={appointmentView === view}
              className={appointmentView === view ? 'appointment-tab appointment-tab--active' : 'appointment-tab'}
              onClick={() => setAppointmentView(view)}
            >
              {label}
            </button>
          ))}
        </div>}
      <button className="text-button" type="button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
    </div>
    {error && <PageNotice message={error} />}
    {loading ? <LoadingIndicator label={focus === 'prescriptions' ? 'Loading completed visits' : 'Loading appointments'} /> : visibleAppointments.map((item) => <AppointmentCard key={item.id} appointment={item} kind="doctor" onChanged={() => void load()} onConsult={(value) => void openConsultation(value)} />)}
    {!loading && !visibleAppointments.length && (
      <EmptyState
        title={focus === 'prescriptions'
          ? 'No completed visits'
          : appointmentView === 'cancelled'
            ? 'No canceled appointments'
          : appointmentView === 'active'
            ? 'No active appointments'
            : appointmentView === 'history'
              ? 'No appointment history'
              : 'No appointments'}
        description={focus === 'prescriptions'
          ? 'Completed consultations will appear here when they are ready for prescription work.'
          : appointmentView === 'cancelled'
            ? 'Appointments you canceled or that were canceled will appear here.'
          : appointmentView === 'active'
            ? 'New bookings that need confirmation or consultation will appear here.'
            : 'Try another appointment filter or refresh the list.'}
      />
    )}
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
      <section className="workflow-modal workflow-modal--wide" role="dialog" aria-modal="true" aria-labelledby="consult-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close" onClick={() => setSelected(null)}><X size={19} /></button>
        <span className="eyebrow">CONSULTATION · {selected.patient_first_name} {selected.patient_last_name}</span>
        <h2 id="consult-title">Clinical documentation</h2>
        {selected.patient_allergies && <div className="warning-message">Patient allergies: {selected.patient_allergies}</div>}
        {notice && <div className="success-message">{notice}</div>}
        {error && <PageNotice message={error} />}
        {!consultation ? <LoadingIndicator label="Opening consultation" /> : (
          <>
            <div className="consultation-form">
              {([
                ['symptoms', 'Symptoms'],
                ['diagnosis', 'Diagnosis'],
                ['clinical_notes', 'Clinical notes'],
                ['treatment_plan', 'Treatment plan'],
                ['follow_up_instructions', 'Follow-up instructions'],
              ] as const).map(([field, label]) => <label className="field-label" key={field}>{label}<textarea rows={field === 'clinical_notes' ? 4 : 2} value={consultation[field]} onChange={(event) => setConsultation({ ...consultation, [field]: event.target.value })} /></label>)}
            </div>
            <div className="modal-actions">
              {selected.status !== 'completed' && <button className="button button--secondary" type="button" disabled={saving} onClick={() => void saveConsultation(false)}>Save draft</button>}
              {selected.status !== 'completed' && <button className="button button--primary" type="button" disabled={saving} onClick={() => void saveConsultation(true)}>Complete consultation</button>}
            </div>
            {selected.status === 'completed' && (
              <div className="prescription-editor">
                <h3>Prescription</h3>
                {prescription?.is_signed ? <div className="success-message">This prescription has been finalized.</div> : (
                  <>
                    {medicines.map((medicine, index) => <div className="medicine-fields" key={index}>
                      {(['name', 'dosage', 'frequency', 'duration', 'instructions'] as const).map((key) => <label key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}<input value={medicine[key]} onChange={(event) => setMedicines(medicines.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item))} /></label>)}
                    </div>)}
                    <div className="modal-actions">
                      <button className="button button--secondary" type="button" onClick={() => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])}>Add medicine</button>
                      {!prescription && <button className="button button--primary" disabled={saving} type="button" onClick={() => void createPrescription()}>Save prescription draft</button>}
                      {prescription && <button className="button button--primary" disabled={saving} type="button" onClick={() => void finalizePrescription()}>Finalize prescription</button>}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>}
  </section>
}

const availabilitySchema = z.object({
  day: z.string().regex(/^[0-6]$/),
  start: z.string(),
  end: z.string(),
  duration: z.enum(['15', '30', '45', '60']),
}).refine((value) => value.end > value.start, {
  message: 'End time must be after start time.',
  path: ['end'],
})

export function DoctorSchedulePage() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [horizonDays, setHorizonDays] = useState(14)
  const [selectedDate, setSelectedDate] = useState(dateRange(1).from)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [editingAvailability, setEditingAvailability] = useState<AvailabilityWindow | null>(null)
  const [removeWindow, setRemoveWindow] = useState<AvailabilityWindow | null>(null)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideWindows, setOverrideWindows] = useState<Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>>([])
  const [overrideStart, setOverrideStart] = useState('09:00')
  const [overrideEnd, setOverrideEnd] = useState('12:00')
  const [overrideDuration, setOverrideDuration] = useState(30)
  const [blockDateOpen, setBlockDateOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('09:30')
  const [blockSlotTarget, setBlockSlotTarget] = useState<ScheduleSlot | null>(null)
  const { from: fromDate, to: toDate } = dateRange(horizonDays)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { day: '1', start: '09:00', end: '12:00', duration: '30' },
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [windows, generatedSlots, dateOverrides] = await Promise.all([
        api.availability(),
        api.generateMySlots(fromDate, toDate),
        api.scheduleOverrides(fromDate, toDate),
      ])
      setAvailability(windows)
      setSlots(generatedSlots)
      setOverrides(dateOverrides)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your schedule.')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])
  useEffect(() => { void load() }, [load])

  const selectedOverride = overrides.find((item) => item.override_date === selectedDate)
  const selectedSlots = slots.filter((slot) => slot.date === selectedDate && slot.status !== 'cancelled')
  const bookedCount = selectedSlots.filter((slot) =>
    ['booked', 'reserved'].includes(slot.status) &&
    new Date(`${slot.date}T${slot.start_time}`).getTime() > scheduleReferenceTime
  ).length
  const weeklyWindows = availability.filter((item) =>
    item.day_of_week === new Date(`${selectedDate}T12:00:00`).getDay() && item.is_active
  )
  const activeWindows = availability.filter((item) => item.is_active)
  const availableSlots = slots.filter((slot) =>
    slot.status === 'available' &&
    !overrides.some((override) => override.override_date === slot.date && override.is_blocked)
  ).length
  const calendarDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const monthStartOffset = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
  const monthStart = localDate(calendarMonth)
  const monthEnd = localDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), calendarDays))
  const canGoPreviousMonth = monthStart > fromDate
  const canGoNextMonth = monthEnd < toDate

  const changeHorizon = (daysCount: number) => {
    const nextRange = dateRange(daysCount)
    const nextDate = selectedDate < nextRange.from || selectedDate > nextRange.to ? nextRange.from : selectedDate
    setSelectedDate(nextDate)
    const parsedDate = new Date(`${nextDate}T12:00:00`)
    setCalendarMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1))
    setHorizonDays(daysCount)
  }

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1)
    const nextStart = localDate(nextMonth)
    const nextEnd = localDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0))
    if (nextEnd < fromDate || nextStart > toDate) return
    setCalendarMonth(nextMonth)
    if (selectedDate < nextStart || selectedDate > nextEnd) setSelectedDate(nextStart < fromDate ? fromDate : nextStart)
  }

  const submit = handleSubmit(async (values) => {
    setError('')
    setSaving(true)
    try {
      const body = {
        day_of_week: Number(values.day),
        start_time: values.start,
        end_time: values.end,
        slot_duration_minutes: Number(values.duration),
      }
      if (editingAvailability) await api.updateAvailability(editingAvailability.id, body)
      else await api.addAvailability(body)
      setNotice(editingAvailability ? 'Weekly availability updated.' : 'Weekly availability added.')
      setEditingAvailability(null)
      reset({ day: '1', start: '09:00', end: '12:00', duration: '30' })
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save availability.')
    } finally {
      setSaving(false)
    }
  })

  const editAvailability = (item?: AvailabilityWindow) => {
    setEditingAvailability(item ?? null)
    reset(item
      ? {
          day: String(item.day_of_week) as z.infer<typeof availabilitySchema>['day'],
          start: item.start_time.slice(0, 5),
          end: item.end_time.slice(0, 5),
          duration: String(item.slot_duration_minutes) as z.infer<typeof availabilitySchema>['duration'],
        }
      : { day: '1', start: '09:00', end: '12:00', duration: '30' })
  }

  const toggleAvailability = async (item: AvailabilityWindow) => {
    setError('')
    try {
      await api.updateAvailability(item.id, { is_active: !item.is_active })
      setNotice(item.is_active ? 'Weekly availability paused.' : 'Weekly availability published.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update availability.')
    }
  }

  const removeAvailability = async () => {
    if (!removeWindow) return
    setSaving(true)
    try {
      await api.removeAvailability(removeWindow.id)
      setRemoveWindow(null)
      setNotice('Weekly availability window removed.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove availability.')
    } finally {
      setSaving(false)
    }
  }

  const addOverrideWindow = () => {
    if (overrideEnd <= overrideStart) {
      setError('End time must be after start time.')
      return
    }
    const candidate = {
      start_time: `${overrideStart}:00`,
      end_time: `${overrideEnd}:00`,
      slot_duration_minutes: overrideDuration,
    }
    if (overrideWindows.some((window) => window.start_time < candidate.end_time && window.end_time > candidate.start_time)) {
      setError('Date-specific working windows cannot overlap.')
      return
    }
    setError('')
    setOverrideWindows([...overrideWindows, candidate].sort((a, b) => a.start_time.localeCompare(b.start_time)))
  }

  const saveOverride = async () => {
    if (!overrideWindows.length) {
      setError('Add at least one custom time window.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.saveScheduleOverride({ date: selectedDate, is_blocked: false, windows: overrideWindows })
      setOverrideOpen(false)
      setNotice(`Custom hours saved for ${selectedDate}.`)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save date-specific hours.')
    } finally {
      setSaving(false)
    }
  }

  const blockDate = async () => {
    setSaving(true)
    setError('')
    try {
      await api.saveScheduleOverride({
        date: selectedDate,
        is_blocked: true,
        windows: [],
        expected_booked_count: bookedCount,
      })
      setBlockDateOpen(false)
      setNotice(bookedCount
        ? `${bookedCount} appointment(s) cancelled; affected patients were notified.`
        : `${selectedDate} is blocked.`)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to block this date.')
    } finally {
      setSaving(false)
    }
  }

  const restoreWeeklyHours = async () => {
    setError('')
    try {
      await api.removeScheduleOverride(selectedDate)
      setNotice('Recurring weekly hours restored for this date.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to restore weekly hours.')
    }
  }

  const saveSlotEdit = async () => {
    if (!editingSlot) return
    if (slotEnd <= slotStart) {
      setError('Slot end time must be after its start time.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.updateScheduleSlot(editingSlot.id, {
        action: 'edit',
        start_time: `${slotStart}:00`,
        end_time: `${slotEnd}:00`,
      })
      setEditingSlot(null)
      setNotice('Appointment slot updated.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to edit this slot.')
    } finally {
      setSaving(false)
    }
  }

  const blockSlot = async (slot: ScheduleSlot, expectedBookedCount: number) => {
    setSaving(true)
    setError('')
    try {
      await api.updateScheduleSlot(slot.id, { action: 'block', expected_booked_count: expectedBookedCount })
      setBlockSlotTarget(null)
      setNotice(expectedBookedCount
        ? 'Appointment cancelled; the patient was notified to rebook.'
        : 'Appointment slot blocked.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to block this slot.')
    } finally {
      setSaving(false)
    }
  }

  const restoreSlot = async (slot: ScheduleSlot) => {
    setSaving(true)
    setError('')
    try {
      await api.updateScheduleSlot(slot.id, { action: 'restore' })
      setNotice('Appointment slot restored.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to restore this slot.')
    } finally {
      setSaving(false)
    }
  }

  const generate = async () => {
    setSaving(true)
    setError('')
    try {
      setSlots(await api.generateMySlots(fromDate, toDate))
      setNotice(`Generated schedule slots from ${fromDate} to ${toDate}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate slots.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="page-content">
    <PageHeading eyebrow="DOCTOR WORKSPACE" title="Availability & hours" description="Configure recurring hours, date-specific changes, and individual appointment slots." />
    {notice && <div className="success-message" role="status">{notice}</div>}
    {error && <PageNotice message={error} onRetry={() => void load()} />}
    <div className="metrics-grid metrics-grid--three">
      <MetricCard label="Active windows" value={activeWindows.length} note="Published weekly hours" icon={Clock3} />
      <MetricCard label="Available slots" value={availableSlots} note={`Next ${horizonDays} days`} icon={CalendarDays} />
      <MetricCard label="Working days" value={new Set(activeWindows.map((item) => item.day_of_week)).size} note="Days with published hours" icon={Check} />
    </div>

    <section className="panel schedule-calendar-panel">
      <div className="section-title"><div><h2>Scheduling calendar</h2><p>Choose a date to review or adjust your schedule.</p></div></div>
      <div className="horizon-row">
        {[7, 14, 21, 30].map((daysCount) => <button
          key={daysCount}
          type="button"
          className={`horizon-pill${horizonDays === daysCount ? ' horizon-pill--active' : ''}`}
          onClick={() => changeHorizon(daysCount)}
        >{daysCount === 30 ? '1 month' : `${daysCount / 7} week${daysCount === 7 ? '' : 's'}`}</button>)}
      </div>
      <p className="calendar-range">Showing {fromDate} through {toDate}</p>
      <div className="calendar-month-header">
        <button className="icon-button" type="button" disabled={!canGoPreviousMonth} aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
        <h3>{calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
        <button className="icon-button" type="button" disabled={!canGoNextMonth} aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
      </div>
      <div className="calendar-grid" role="grid" aria-label="Availability calendar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}
        {Array.from({ length: monthStartOffset }, (_, index) => <span className="calendar-cell calendar-cell--empty" key={`empty-${index}`} />)}
        {Array.from({ length: calendarDays }, (_, index) => {
          const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)
          const dateKey = localDate(date)
          const enabled = dateKey >= fromDate && dateKey <= toDate
          const dateOverride = overrides.find((item) => item.override_date === dateKey)
          const available = slots.some((slot) => slot.date === dateKey && slot.status === 'available')
          return <button
            type="button"
            role="gridcell"
            aria-selected={dateKey === selectedDate}
            aria-label={`${dateKey}${dateOverride?.is_blocked ? ', blocked' : available ? ', has available slots' : ''}`}
            disabled={!enabled}
            className={`calendar-cell${enabled ? ' calendar-cell--enabled' : ''}${dateKey === selectedDate ? ' calendar-cell--selected' : ''}`}
            key={dateKey}
            onClick={() => setSelectedDate(dateKey)}
          >
            <span>{index + 1}</span>
            {dateOverride?.is_blocked ? <i className="calendar-dot calendar-dot--blocked" /> : available ? <i className="calendar-dot" /> : null}
          </button>
        })}
      </div>
      <div className="calendar-legend"><span><i className="calendar-dot" /> Bookable slots</span><span><i className="calendar-dot calendar-dot--blocked" /> Blocked date</span></div>
    </section>

    <section className="panel selected-date-panel">
      <div className="selected-date-heading">
        <div>
          <span className="eyebrow">SELECTED DATE</span>
          <h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
          <p>{selectedOverride?.is_blocked ? 'Blocked for leave or holiday' : selectedOverride ? 'Date-specific hours override the weekly schedule' : 'Following recurring weekly hours'}</p>
        </div>
        <div className="date-actions">
          <button type="button" className="button button--secondary" onClick={() => {
            setError('')
            setOverrideWindows(selectedOverride && !selectedOverride.is_blocked
              ? selectedOverride.windows.map(({ start_time, end_time, slot_duration_minutes }) => ({ start_time, end_time, slot_duration_minutes }))
              : [])
            setOverrideStart('09:00')
            setOverrideEnd('12:00')
            setOverrideDuration(30)
            setOverrideOpen(true)
          }}>Custom hours</button>
          <button type="button" className="button button--danger-ghost" disabled={selectedOverride?.is_blocked || saving} onClick={() => setBlockDateOpen(true)}>Block day</button>
          {selectedOverride && <button type="button" className="button button--secondary" disabled={saving} onClick={() => void restoreWeeklyHours()}>Use weekly hours</button>}
        </div>
      </div>
      {(selectedOverride && !selectedOverride.is_blocked ? selectedOverride.windows : weeklyWindows).map((window) => (
        <div className="schedule-window-row" key={window.id}>
          <strong>{readableTime(window.start_time)}–{readableTime(window.end_time)}</strong>
          <span>{window.slot_duration_minutes} minute slots</span>
        </div>
      ))}
      {selectedOverride?.is_blocked && <p className="muted-copy">No appointments can be booked on this date.</p>}
      {!selectedOverride && weeklyWindows.length === 0 && <p className="muted-copy">No weekly hours are set for this weekday.</p>}
    </section>

    <div className="section-title"><h2>Slots for {selectedDate}</h2><button className="text-button" type="button" disabled={saving} onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
    {loading ? <LoadingIndicator label="Loading schedule" /> : selectedSlots.length ? selectedSlots.map((slot) => {
      const booked = ['booked', 'reserved'].includes(slot.status)
      const dateBlocked = selectedOverride?.is_blocked && slot.status === 'available'
      const canBlock = !dateBlocked && ['available', 'booked', 'reserved'].includes(slot.status)
      return <article className="data-card schedule-slot-card" key={slot.id}>
        <div className="data-card__main">
          <div className="data-card__avatar"><Clock3 size={19} /></div>
          <div className="data-card__body">
            <div className="data-card__title-row"><h3>{readableTime(slot.start_time)}–{readableTime(slot.end_time)}</h3><StatusBadge status={dateBlocked ? 'blocked' : slot.status} /></div>
            <p className="data-card__meta">{dateBlocked ? 'Blocked for this date' : booked ? 'Booked · locked' : slot.status === 'blocked' ? 'Blocked' : 'Available'}{slot.is_manual_override ? ' · custom slot' : ''}</p>
          </div>
        </div>
        <div className="data-card__actions">
          {slot.status === 'available' && !dateBlocked && <button className="button button--secondary" type="button" disabled={saving} onClick={() => {
            setEditingSlot(slot)
            setSlotStart(slot.start_time.slice(0, 5))
            setSlotEnd(slot.end_time.slice(0, 5))
          }}>Edit time</button>}
          {canBlock && <button className="button button--danger-ghost" type="button" disabled={saving} onClick={() => booked ? setBlockSlotTarget(slot) : void blockSlot(slot, 0)}>{booked ? 'Block & cancel' : 'Block'}</button>}
          {slot.status === 'blocked' && <button className="button button--secondary" type="button" disabled={saving} onClick={() => void restoreSlot(slot)}>Restore</button>}
        </div>
      </article>
    }) : <EmptyState title="No slots for this date" description="Add weekly hours or set custom hours for the selected date." />}

    <div className="schedule-columns">
      <section className="panel">
        <div className="section-title"><h2>Weekly working hours</h2><button className="button button--secondary" type="button" onClick={() => editAvailability()}>+ Add window</button></div>
        {loading && availability.length === 0 ? <LoadingIndicator /> : availability.length ? days.flatMap((day, dayIndex) =>
          availability.filter((item) => item.day_of_week === dayIndex).map((item) => <div className="availability-row" key={item.id}>
            <div><strong>{day} · {readableTime(item.start_time)}–{readableTime(item.end_time)}</strong><span>{item.slot_duration_minutes} minute slots</span></div>
            <div className="availability-actions">
              <button type="button" className={`availability-toggle${item.is_active ? ' availability-toggle--active' : ''}`} onClick={() => void toggleAvailability(item)}>{item.is_active ? 'Active' : 'Inactive'}</button>
              <button type="button" className="text-button" onClick={() => editAvailability(item)}>Edit</button>
              <button className="icon-action icon-action--danger" type="button" aria-label={`Remove ${day} availability`} onClick={() => setRemoveWindow(item)}><X size={17} /></button>
            </div>
          </div>)
        ) : <EmptyState title="No weekly hours set" description="Add an availability window to start accepting bookings." />}
      </section>
      <section className="panel">
        <div className="section-title"><h2>{editingAvailability ? 'Edit availability window' : 'Add availability window'}</h2></div>
        <form className="stack-form" onSubmit={(event) => void submit(event)}>
          <label>Day of week<select {...register('day')}>{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
          <div className="auth-form__row"><label>Start time<input type="time" {...register('start')} /></label><label>End time<input type="time" {...register('end')} /></label></div>
          <label>Slot duration<select {...register('duration')}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
          {errors.end && <p className="inline-error">{errors.end.message}</p>}
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingAvailability ? 'Save changes' : 'Add weekly hours'}</button>
            {editingAvailability && <button className="button button--secondary" type="button" onClick={() => editAvailability()}>Cancel edit</button>}
          </div>
        </form>
      </section>
    </div>
    <section className="panel schedule-generator">
      <div className="section-title"><div><h2>Generate appointment slots</h2><p>Apply weekly hours and date overrides across the selected horizon.</p></div></div>
      <button className="button button--primary" type="button" disabled={saving} onClick={() => void generate()}>{saving ? 'Generating…' : 'Generate slots'}</button>
      {slots.length > 0 && <p className="data-card__detail">{slots.length} slots returned. Patient availability reflects only bookable times.</p>}
    </section>

    <ConfirmationDialog open={blockDateOpen} busy={saving} title="Block this date?" description={`Blocking ${selectedDate} removes availability${bookedCount ? `, cancels ${bookedCount} booked appointment(s), and notifies affected patients` : ''}.`} confirmLabel={saving ? 'Blocking…' : 'Block date'} onCancel={() => !saving && setBlockDateOpen(false)} onConfirm={() => void blockDate()} />
    <ConfirmationDialog open={Boolean(blockSlotTarget)} busy={saving} title="Cancel booked appointment?" description={`Blocking ${blockSlotTarget ? readableTime(blockSlotTarget.start_time) : ''} will cancel the appointment and notify the patient to rebook.`} confirmLabel={saving ? 'Blocking…' : 'Block & cancel'} onCancel={() => !saving && setBlockSlotTarget(null)} onConfirm={() => blockSlotTarget && void blockSlot(blockSlotTarget, 1)} />
    <ConfirmationDialog open={Boolean(removeWindow)} busy={saving} title="Remove weekly hours?" description={removeWindow ? `Remove ${days[removeWindow.day_of_week]} ${readableTime(removeWindow.start_time)}–${readableTime(removeWindow.end_time)} from your recurring schedule?` : ''} confirmLabel={saving ? 'Removing…' : 'Remove hours'} onCancel={() => !saving && setRemoveWindow(null)} onConfirm={() => void removeAvailability()} />

    {overrideOpen && <div className="modal-backdrop" role="presentation" onClick={() => setOverrideOpen(false)}>
      <section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="override-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close" onClick={() => setOverrideOpen(false)}><X size={19} /></button>
        <span className="eyebrow">DATE-SPECIFIC HOURS</span><h2 id="override-title">Custom hours · {selectedDate}</h2><p>These time windows replace recurring hours on this date only.</p>
        {overrideWindows.map((window, index) => <div className="availability-row" key={`${window.start_time}-${index}`}>
          <div><strong>{readableTime(window.start_time)}–{readableTime(window.end_time)}</strong><span>{window.slot_duration_minutes} minute slots</span></div>
          <button type="button" className="icon-action icon-action--danger" aria-label="Remove custom window" onClick={() => setOverrideWindows(overrideWindows.filter((_, windowIndex) => windowIndex !== index))}><X size={16} /></button>
        </div>)}
        <div className="override-window-form">
          <label>Start<input type="time" value={overrideStart} onChange={(event) => setOverrideStart(event.target.value)} /></label>
          <label>End<input type="time" value={overrideEnd} onChange={(event) => setOverrideEnd(event.target.value)} /></label>
          <label>Slot length<select value={overrideDuration} onChange={(event) => setOverrideDuration(Number(event.target.value))}><option value={15}>15 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></label>
        </div>
        <button className="button button--secondary" type="button" onClick={addOverrideWindow}>Add time window</button>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button button--secondary" type="button" onClick={() => setOverrideOpen(false)}>Cancel</button><button className="button button--primary" type="button" disabled={saving || !overrideWindows.length} onClick={() => void saveOverride()}>{saving ? 'Saving…' : 'Save custom hours'}</button></div>
      </section>
    </div>}
    {editingSlot && <div className="modal-backdrop" role="presentation" onClick={() => setEditingSlot(null)}>
      <section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="slot-edit-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close" onClick={() => setEditingSlot(null)}><X size={19} /></button>
        <span className="eyebrow">EDIT APPOINTMENT SLOT</span><h2 id="slot-edit-title">Change slot time</h2><p>Only unbooked slots can be changed.</p>
        <div className="override-window-form"><label>Start<input type="time" value={slotStart} onChange={(event) => setSlotStart(event.target.value)} /></label><label>End<input type="time" value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} /></label></div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button button--secondary" type="button" onClick={() => setEditingSlot(null)}>Cancel</button><button className="button button--primary" type="button" disabled={saving} onClick={() => void saveSlotEdit()}>{saving ? 'Saving…' : 'Save slot'}</button></div>
      </section>
    </div>}
  </section>
}

export function DoctorPrescriptionsPage() {
  return <DoctorAppointmentsPage focus="prescriptions" />
}

export function DoctorVerificationPage() {
  const { user } = useAppSelector((state) => state.auth)
  return <section className="page-content">
    <PageHeading eyebrow="DOCTOR WORKSPACE" title={user?.verificationStatus === 'rejected' ? 'Application not approved' : 'Verification in progress'} description="Doctor access to appointments and clinical workflows is available after approval." />
    <div className={`verification-panel verification-panel--${user?.verificationStatus ?? 'pending'}`}>
      <Stethoscope size={23} />
      <div><h2>{user?.verificationStatus === 'rejected' ? 'Your credentials need review' : 'Your credentials are being reviewed'}</h2><p>{user?.verificationStatus === 'rejected' ? 'Please contact DoctorDirect support for information about the verification decision.' : 'You can sign in and review your account profile while an administrator reviews your credentials.'}</p><StatusBadge status={user?.verificationStatus ?? 'pending'} /></div>
    </div>
  </section>
}

export function AdminDashboardPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setDoctors(await api.adminDoctors('all', '')) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load verification counts.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const counts = useMemo(() => ({
    pending: doctors.filter((item) => item.verification_status === 'pending').length,
    approved: doctors.filter((item) => item.verification_status === 'approved').length,
    rejected: doctors.filter((item) => item.verification_status === 'rejected').length,
  }), [doctors])
  return <section className="page-content">
    <PageHeading eyebrow="ADMIN CONSOLE" title="Doctor credentialing" description="Review professional credentials and manage doctor verification." />
    {error && <PageNotice message={error} onRetry={() => void load()} />}
    {loading ? <LoadingIndicator label="Loading verification summary" /> : <div className="metrics-grid metrics-grid--three">
      <MetricCard label="Pending" value={counts.pending} note="Requires review" icon={Clock3} />
      <MetricCard label="Approved" value={counts.approved} note="Active in directory" icon={Check} />
      <MetricCard label="Rejected" value={counts.rejected} note="Not approved" icon={X} />
    </div>}
    <div className="section-title"><h2>Pending applications</h2><a className="text-button" href="/admin/doctor-verification">Review applications <ArrowRightIcon /></a></div>
    {doctors.filter((item) => item.verification_status === 'pending').slice(0, 4).map((item) => <AdminDoctorCard key={item.doctor_id} doctor={item} onChanged={() => void load()} />)}
    {!loading && !counts.pending && <EmptyState title="No applications pending" description="New doctor applications will appear here." />}
  </section>
}

function ArrowRightIcon() { return <span aria-hidden="true">→</span> }

function AdminDoctorCard({ doctor, onChanged }: { doctor: AdminDoctor; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<'approve' | 'reject' | null>(null)
  const [detail, setDetail] = useState<AdminDoctor | null>(null)
  const [idCardUrl, setIdCardUrl] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const decide = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await api.doctorDecision(doctor.doctor_id, confirm)
      setConfirm(null)
      onChanged()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update doctor verification.') }
    finally { setBusy(false) }
  }
  const viewDetail = async () => {
    setLoadingDetail(true)
    setError('')
    try {
      setDetail(await api.doctorDetails(doctor.doctor_id))
      setIdCardUrl(await api.doctorIdCard(doctor.doctor_id))
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load doctor credentials.') }
    finally { setLoadingDetail(false) }
  }
  return <>
    <article className="data-card admin-doctor-card">
      <div className="data-card__main">
        <div className="data-card__avatar"><Stethoscope size={20} /></div>
        <div className="data-card__body">
          <div className="data-card__title-row"><h3>Dr. {doctor.first_name} {doctor.last_name}</h3><StatusBadge status={doctor.verification_status} /></div>
          <p className="data-card__meta">{doctor.specialization_name} · {doctor.experience_years} years · {doctor.qualification ?? 'Qualification not specified'}</p>
          <p className="data-card__detail">License: {doctor.license_number}{doctor.email ? ` · ${doctor.email}` : ''}</p>
          {error && <p className="inline-error">{error}</p>}
        </div>
      </div>
      <div className="data-card__actions">
        <button className="button button--secondary" type="button" disabled={loadingDetail} onClick={() => void viewDetail()}>{loadingDetail ? 'Loading…' : 'Review credentials'}</button>
        {doctor.verification_status !== 'approved' && <button className="button button--primary" type="button" disabled={busy} onClick={() => setConfirm('approve')}>Approve</button>}
        {doctor.verification_status !== 'rejected' && <button className="button button--danger-ghost" type="button" disabled={busy} onClick={() => setConfirm('reject')}>Reject</button>}
      </div>
    </article>
    <ConfirmationDialog open={Boolean(confirm)} busy={busy} title={`${confirm === 'approve' ? 'Approve' : 'Reject'} doctor`} description={`Confirm ${confirm} for Dr. ${doctor.first_name} ${doctor.last_name}?`} confirmLabel={busy ? 'Saving…' : confirm === 'approve' ? 'Approve doctor' : 'Reject doctor'} onCancel={() => !busy && setConfirm(null)} onConfirm={() => void decide()} />
    {detail && <div className="modal-backdrop" role="presentation" onClick={() => setDetail(null)}><section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby={`doctor-detail-${doctor.doctor_id}`} onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" type="button" aria-label="Close" onClick={() => setDetail(null)}><X size={19} /></button>
      <span className="eyebrow">CREDENTIAL REVIEW</span><h2 id={`doctor-detail-${doctor.doctor_id}`}>Dr. {detail.first_name} {detail.last_name}</h2>
      <dl className="detail-list"><div><dt>Specialization</dt><dd>{detail.specialization_name}</dd></div><div><dt>License</dt><dd>{detail.license_number}</dd></div><div><dt>Experience</dt><dd>{detail.experience_years} years</dd></div><div><dt>Consultation fee</dt><dd>₹{Number(detail.consultation_fee).toLocaleString('en-IN')}</dd></div><div><dt>Qualification</dt><dd>{detail.qualification ?? '—'}</dd></div><div><dt>Bio</dt><dd>{detail.bio ?? '—'}</dd></div></dl>
      {idCardUrl && <a className="button button--secondary" href={idCardUrl} target="_blank" rel="noreferrer">Open private ID card</a>}
    </section></div>}
  </>
}

export function AdminDoctorVerificationPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setDoctors(await api.adminDoctors(filter, search)) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load doctor applications.') }
    finally { setLoading(false) }
  }, [filter, search])
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer) }, [load])
  return <section className="page-content">
    <PageHeading eyebrow="ADMIN CONSOLE" title="Doctor verification" description="Review each application and securely inspect uploaded credentials." />
    <div className="directory-tools">
      <label className="search-field"><Search size={17} /><input placeholder="Search doctors" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter by verification status">
        <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All statuses</option>
      </select>
    </div>
    {error && <PageNotice message={error} onRetry={() => void load()} />}
    {loading ? <LoadingIndicator label="Loading doctor applications" /> : doctors.length ? doctors.map((doctor) => <AdminDoctorCard key={doctor.doctor_id} doctor={doctor} onChanged={() => void load()} />) : <EmptyState title="No matching doctor applications" description="Change the status filter or search phrase." />}
  </section>
}

export function AdminDoctorsPage() {
  return <AdminDoctorVerificationPage />
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setItems(await api.notifications()) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const markRead = async (id: string) => {
    try { await api.markNotificationRead(id); setItems(items.map((item) => item.id === id ? { ...item, is_read: true } : item)) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update notification.') }
  }
  const markAll = async () => {
    try { await api.markAllNotificationsRead(); setItems(items.map((item) => ({ ...item, is_read: true }))) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update notifications.') }
  }
  return <section className="page-content">
    <PageHeading eyebrow="DOCTORDIRECT" title="Notifications" description="Account and care updates for your workspace." />
    <div className="section-title"><h2>Recent notifications</h2><button className="text-button" type="button" onClick={() => void markAll()}>Mark all read</button></div>
    {error && <PageNotice message={error} />}
    {loading ? <LoadingIndicator label="Loading notifications" /> : items.length ? items.map((item) => <article className={`notification-card${item.is_read ? '' : ' notification-card--unread'}`} key={item.id}>
      <div className="notification-card__dot" /><div><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></div>
      {!item.is_read && <button className="text-button" type="button" onClick={() => void markRead(item.id)}>Mark read</button>}
    </article>) : <EmptyState title="You’re all caught up" description="New notifications will appear here." />}
  </section>
}
