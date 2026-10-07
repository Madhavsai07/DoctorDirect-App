import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { appointmentRepository } from './src/repositories/appointment.repository';
import { doctorRepository } from './src/repositories/doctor.repository';
import { pool } from './src/db/pool';

async function runSchedulingIntegrationTest(): Promise<void> {
  const doctorUserId = randomUUID();
  const patientUserId = randomUUID();
  let doctorId: string | undefined;
  let patientId: string | undefined;

  try {
    const specialization = await pool.query<{ id: string }>(
      'SELECT id FROM specializations ORDER BY name LIMIT 1'
    );
    assert.ok(specialization.rows[0], 'The specialization catalog must be seeded.');

    const range = await pool.query<{ date: string; next_date: string; day_of_week: number }>(
      `SELECT (CURRENT_DATE + 1)::text AS date,
              (CURRENT_DATE + 2)::text AS next_date,
              EXTRACT(DOW FROM CURRENT_DATE + 1)::int AS day_of_week`
    );
    const { date, next_date: blockedDate, day_of_week: dayOfWeek } = range.rows[0];

    await pool.query(
      `INSERT INTO users (id, email, role, first_name, last_name)
       VALUES ($1, $2, 'doctor', 'Schedule', 'Integration'),
              ($3, $4, 'patient', 'Schedule', 'Patient')`,
      [
        doctorUserId,
        `schedule-doctor-${doctorUserId}@example.invalid`,
        patientUserId,
        `schedule-patient-${patientUserId}@example.invalid`,
      ]
    );

    const doctor = await pool.query<{ id: string }>(
      `INSERT INTO doctors
         (user_id, specialization_id, license_number, verification_status)
       VALUES ($1, $2, $3, 'approved')
       RETURNING id`,
      [doctorUserId, specialization.rows[0].id, `TEST-${doctorUserId}`]
    );
    doctorId = doctor.rows[0].id;

    const patient = await pool.query<{ id: string }>(
      'INSERT INTO patients (user_id) VALUES ($1) RETURNING id',
      [patientUserId]
    );
    patientId = patient.rows[0].id;

    const morning = await doctorRepository.upsertAvailability(doctorId, {
      day_of_week: dayOfWeek,
      start_time: '09:00:00',
      end_time: '12:00:00',
      slot_duration_minutes: 60,
      is_active: true,
    });
    await doctorRepository.upsertAvailability(doctorId, {
      day_of_week: dayOfWeek,
      start_time: '14:00:00',
      end_time: '17:00:00',
      slot_duration_minutes: 30,
      is_active: true,
    });

    let slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 9,
      'Multiple recurring windows should generate 3 hourly plus 6 half-hour slots.');

    await doctorRepository.updateAvailability(morning.id, doctorId, {
      start_time: '09:00:00',
      end_time: '10:00:00',
      slot_duration_minutes: 60,
    });
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 7,
      'Regeneration should reconcile future slots after editing a weekly rule.');
    await doctorRepository.updateAvailability(morning.id, doctorId, { slot_duration_minutes: 15 });
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 10,
      'Weekly generation should support 15-minute slots.');
    await doctorRepository.updateAvailability(morning.id, doctorId, { slot_duration_minutes: 45 });
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 7,
      'Weekly generation should support 45-minute slots.');
    await doctorRepository.updateAvailability(morning.id, doctorId, { slot_duration_minutes: 60 });
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);

    await doctorRepository.saveScheduleOverride(doctorId, date, false, [
      { start_time: '10:00:00', end_time: '11:00:00', slot_duration_minutes: 30 },
      { start_time: '13:00:00', end_time: '14:00:00', slot_duration_minutes: 30 },
    ]);
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 4,
      'Date-specific windows should replace the weekly schedule for that date.');

    await doctorRepository.deleteScheduleOverride(doctorId, date);
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    assert.equal(slots.filter((slot) => slot.status === 'available').length, 7,
      'Restoring weekly hours should resume recurring availability for that date.');

    await doctorRepository.upsertAvailability(doctorId, {
      day_of_week: (dayOfWeek + 1) % 7,
      start_time: '09:00:00',
      end_time: '10:00:00',
      slot_duration_minutes: 60,
      is_active: true,
    });
    const beforeBlock = await doctorRepository.generateSlots(doctorId, blockedDate, blockedDate);
    assert.equal(beforeBlock.length, 1, 'The test leave date should begin with a weekly slot.');
    const dayBlockAppointment = await appointmentRepository.bookSlot({
      patientId,
      patientUserId,
      slotId: beforeBlock[0].id,
      reasonForVisit: 'Doctor day-block notification verification',
    });
    await doctorRepository.saveScheduleOverride(doctorId, blockedDate, true, [], 1);
    const dayBlockStatus = await pool.query<{ status: string }>(
      'SELECT status FROM appointments WHERE id = $1',
      [dayBlockAppointment.id]
    );
    assert.equal(dayBlockStatus.rows[0]?.status, 'cancelled',
      'Blocking a date should cancel its booked appointment.');
    const dayBlockNotification = await pool.query<{ message: string }>(
      `SELECT message FROM notifications
       WHERE recipient_user_id = $1 AND event_key = $2`,
      [patientUserId, `doctor-blocked-appointment:${dayBlockAppointment.id}`]
    );
    assert.match(dayBlockNotification.rows[0]?.message ?? '', /book another available slot/,
      'The patient should be told to book another slot when a date is blocked.');
    const blockedSlots = await doctorRepository.generateSlots(doctorId, blockedDate, blockedDate);
    assert.equal(blockedSlots.length, 0, 'Blocked dates must not expose patient-bookable slots.');

    await doctorRepository.deleteScheduleOverride(doctorId, date);
    await doctorRepository.saveScheduleOverride(doctorId, date, false, [
      { start_time: '10:00:00', end_time: '11:00:00', slot_duration_minutes: 30 },
      { start_time: '13:00:00', end_time: '14:00:00', slot_duration_minutes: 30 },
    ]);
    slots = await doctorRepository.generateSlots(doctorId, date, date, true);
    const slotToEdit = slots.find((slot) => slot.start_time.startsWith('10:00') && slot.status === 'available');
    assert.ok(slotToEdit, 'Expected an available date-specific slot to edit.');
    const edited = await doctorRepository.updateSlot(
      doctorId,
      slotToEdit.id,
      'edit',
      '10:30:00',
      '11:30:00'
    );
    assert.equal(edited?.start_time, '10:30:00');

    const patientSlots = await doctorRepository.generateSlots(doctorId, date, date);
    assert.ok(patientSlots.some((slot) => slot.id === slotToEdit.id),
      'Patients should receive the final valid manually edited slot.');
    const slotToBlockAndRestore = patientSlots.find(
      (slot) => slot.id !== slotToEdit.id && slot.status === 'available'
    );
    assert.ok(slotToBlockAndRestore, 'Expected another available slot to test blocking and restore.');
    const blockedUnbooked = await doctorRepository.updateSlot(
      doctorId,
      slotToBlockAndRestore.id,
      'block'
    );
    assert.equal(blockedUnbooked?.status, 'blocked',
      'Doctors should be able to block an unbooked slot.');
    const restoredUnbooked = await doctorRepository.updateSlot(
      doctorId,
      slotToBlockAndRestore.id,
      'restore'
    );
    assert.equal(restoredUnbooked?.status, 'available',
      'Doctors should be able to restore a blocked unbooked slot.');

    const rescheduleTarget = patientSlots.find(
      (slot) => slot.id !== slotToEdit.id && slot.id !== slotToBlockAndRestore.id && slot.status === 'available'
    );
    assert.ok(rescheduleTarget, 'Expected a second available slot for rescheduling.');
    const appointmentForReschedule = await appointmentRepository.bookSlot({
      patientId,
      patientUserId,
      slotId: slotToBlockAndRestore.id,
      reasonForVisit: 'Reschedule and cancellation verification',
    });
    const rescheduledAppointment = await appointmentRepository.rescheduleAppointment({
      appointmentId: appointmentForReschedule.id,
      newSlotId: rescheduleTarget.id,
      patientId,
    });
    assert.equal(rescheduledAppointment.slot_id, rescheduleTarget.id,
      'Patients should be able to reschedule an appointment to another valid slot.');
    await appointmentRepository.updateStatus({
      appointmentId: appointmentForReschedule.id,
      newStatus: 'cancelled',
      cancellationReason: 'Scheduling integration cleanup',
      actorRole: 'patient',
    });
    const releasedRescheduleSlot = await pool.query<{ status: string }>(
      'SELECT status FROM slots WHERE id = $1',
      [rescheduleTarget.id]
    );
    assert.equal(releasedRescheduleSlot.rows[0]?.status, 'available',
      'Cancelling an appointment should release its future slot.');

    const slotBlockAppointment = await appointmentRepository.bookSlot({
      patientId,
      patientUserId,
      slotId: slotToEdit.id,
      reasonForVisit: 'Scheduling integration verification',
    });
    await assert.rejects(
      appointmentRepository.bookSlot({
        patientId,
        patientUserId,
        slotId: slotToEdit.id,
      }),
      (error: unknown) => (error as { status?: number }).status === 409,
      'Repeated booking attempts must fail for an occupied slot.'
    );
    await assert.rejects(
      doctorRepository.updateSlot(doctorId!, slotToEdit.id, 'edit', '11:30:00', '12:00:00'),
      (error: unknown) => (error as { status?: number }).status === 409,
      'A booked slot must remain locked.'
    );
    await assert.rejects(
      doctorRepository.updateSlot(doctorId, slotToEdit.id, 'block', undefined, undefined, 0),
      (error: unknown) => (error as { status?: number }).status === 409,
      'A stale confirmation must not cancel a newly booked appointment.'
    );
    const blockedBookedSlot = await doctorRepository.updateSlot(
      doctorId,
      slotToEdit.id,
      'block',
      undefined,
      undefined,
      1
    );
    assert.equal(blockedBookedSlot?.status, 'blocked',
      'A confirmed doctor action should block a booked slot after cancelling its appointment.');
    const slotBlockStatus = await pool.query<{ status: string }>(
      'SELECT status FROM appointments WHERE id = $1',
      [slotBlockAppointment.id]
    );
    assert.equal(slotBlockStatus.rows[0]?.status, 'cancelled');
    const slotBlockNotification = await pool.query<{ message: string }>(
      `SELECT message FROM notifications
       WHERE recipient_user_id = $1 AND event_key = $2`,
      [patientUserId, `doctor-blocked-appointment:${slotBlockAppointment.id}`]
    );
    assert.match(slotBlockNotification.rows[0]?.message ?? '', /book another available slot/);

    console.log('PASS: weekly windows, 15/30/45/60-minute slots, rule edits, date overrides, weekly restore, leave blocks, slot edit/block/restore, patient visibility, booking conflicts, booked-slot locking, and block notifications.');
  } finally {
    await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[doctorUserId, patientUserId]]);
    await pool.end();
  }
}

runSchedulingIntegrationTest().catch((error: unknown) => {
  console.error('Doctor scheduling integration test failed:', error);
  process.exitCode = 1;
});
