import assert from 'node:assert/strict';
import { pool } from './src/db/pool';
import { doctorRepository } from './src/repositories/doctor.repository';
import { closeTestClients, createTestAccounts, TestAccount, createTestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function request(path: string, headers: Record<string, string>, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, ok: response.ok, data };
}

async function runMilestone8Verification(): Promise<void> {
  let doctor: TestAccount | undefined;
  let otherDoctor: TestAccount | undefined;
  let patient: TestAccount | undefined;

  try {
    const accounts = await createTestAccounts([
      { role: 'doctor' },
      { role: 'doctor' },
      { role: 'patient' },
    ]);
    [doctor, otherDoctor, patient] = accounts;
    const doctorAccount = accounts[0];
    const otherDoctorAccount = accounts[1];
    const patientAccount = accounts[2];
    if (!doctorAccount.doctorId || !otherDoctorAccount.doctorId || !patientAccount.patientId) {
      throw new Error('The isolated Supabase test accounts must have application profiles.');
    }
    const doctorId = doctorAccount.doctorId;

    for (let day = 0; day < 7; day += 1) {
      await doctorRepository.upsertAvailability(doctorId, {
        day_of_week: day,
        start_time: '09:00:00',
        end_time: '12:00:00',
        slot_duration_minutes: 30,
        is_active: true,
      });
    }

    const dateRange = await pool.query<{ from_date: string; to_date: string }>(
      `SELECT (CURRENT_DATE + 1)::text AS from_date,
              (CURRENT_DATE + 7)::text AS to_date`
    );
    const { from_date: fromDate, to_date: toDate } = dateRange.rows[0];
    const generated = await request(`/doctor/me/slots/generate`, doctorAccount.headers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_date: fromDate, to_date: toDate }),
    });
    assert.equal(generated.status, 200, `Doctor can generate test slots (got ${generated.status})`);

    const slotsResponse = await request(
      `/doctor/${doctorId}/slots?from_date=${fromDate}&to_date=${toDate}`,
      patientAccount.headers
    );
    assert.equal(slotsResponse.status, 200, 'Patient can load doctor availability.');
    const slot = slotsResponse.data.slots.find((item: { status: string }) => item.status === 'available');
    assert.ok(slot, 'At least one future bookable slot was generated.');

    const booking = await request('/appointments/book', patientAccount.headers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slot.id, reason_for_visit: 'Integration flow verification' }),
    });
    assert.equal(booking.status, 201, 'Patient can book a future available slot.');
    const appointmentId = booking.data.appointment.id;

    const confirmation = await request(`/appointments/${appointmentId}/confirm`, doctorAccount.headers, { method: 'PATCH' });
    assert.equal(confirmation.status, 200, 'The owning doctor can confirm the appointment.');

    const started = await request('/consultations', doctorAccount.headers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: appointmentId }),
    });
    assert.equal(started.status, 201, 'The owning doctor can start a consultation.');
    const consultationId = started.data.consultation.id;

    const earlyPrescription = await request('/prescriptions', doctorAccount.headers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId,
        diagnosis: 'Test diagnosis',
        medicines: [{ name: 'Medicine', dosage: '1 tablet', frequency: 'Daily', duration: '3 days' }],
      }),
    });
    assert.equal(earlyPrescription.status, 400, 'Prescription creation is rejected before consultation completion.');

    const completed = await request(`/consultations/${consultationId}/complete`, doctorAccount.headers, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: 'Integration diagnosis', treatment_plan: 'Integration treatment' }),
    });
    assert.equal(completed.status, 200, 'Doctor can complete the consultation.');

    const created = await request('/prescriptions', doctorAccount.headers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId,
        diagnosis: 'Integration diagnosis',
        medicines: [{ name: 'Medicine', dosage: '1 tablet', frequency: 'Daily', duration: '3 days' }],
        generalAdvice: 'Test advice',
      }),
    });
    assert.equal(created.status, 201, 'Doctor can create a prescription draft after completion.');
    const prescriptionId = created.data.prescription.id;

    const edited = await request(`/prescriptions/${prescriptionId}`, doctorAccount.headers, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: 'Updated integration diagnosis' }),
    });
    assert.equal(edited.status, 200, 'Owning doctor can edit the unsigned draft.');

    const wrongDoctorEdit = await request(`/prescriptions/${prescriptionId}`, otherDoctorAccount.headers, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: 'Unauthorized edit' }),
    });
    assert.equal(wrongDoctorEdit.status, 403, 'Another doctor cannot edit this prescription.');

    const patientDraftRead = await request(`/prescriptions/${prescriptionId}`, patientAccount.headers);
    assert.equal(patientDraftRead.status, 404, 'Patient cannot read an unsigned prescription draft.');

    const finalized = await request(`/prescriptions/${prescriptionId}/finalize`, doctorAccount.headers, { method: 'PATCH' });
    assert.equal(finalized.status, 200, 'Owning doctor can finalize a draft.');
    assert.equal(finalized.data.prescription.is_signed, true, 'Finalized prescription is marked signed.');

    const immutable = await request(`/prescriptions/${prescriptionId}`, doctorAccount.headers, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: 'Attempted finalized edit' }),
    });
    assert.equal(immutable.status, 400, 'Finalized prescription remains immutable.');

    const patientRead = await request(`/prescriptions/consultation/${consultationId}`, patientAccount.headers);
    assert.equal(patientRead.status, 200, 'Patient can read their own finalized prescription.');

    const history = await request('/prescriptions/patient/history', patientAccount.headers);
    assert.equal(history.status, 200, 'Patient prescription history loads.');
    assert.ok(history.data.prescriptions.some((item: { id: string }) => item.id === prescriptionId),
      'Finalized prescription appears in the patient history.');

    const crossPatient = await createTestAccount('patient');
    try {
      const forbidden = await request(`/prescriptions/${prescriptionId}`, crossPatient.headers);
      assert.equal(forbidden.status, 403, 'Another patient cannot read this prescription.');
    } finally {
      await crossPatient.cleanup();
    }
    console.log('Milestone 8 consultation and prescription integration checks passed.');
  } catch (error) {
    console.error('Milestone 8 integration test failed:', error);
    process.exitCode = 1;
  } finally {
    await patient?.cleanup();
    await otherDoctor?.cleanup();
    await doctor?.cleanup();
    await closeTestClients();
  }
}

runMilestone8Verification().catch(async (error: unknown) => {
  console.error('Milestone 8 integration setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
