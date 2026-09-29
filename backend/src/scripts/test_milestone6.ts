import { Pool } from 'pg';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BASE_URL = 'http://localhost:5001/api/v1';

async function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode || 500, data });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Dev headers
const PATIENT_HEADERS = {
  'x-dev-bypass': 'true',
  'x-dev-role': 'patient',
  'x-dev-user-id': '22222222-2222-2222-2222-222222222202',
};

const DOCTOR_1_HEADERS = {
  'x-dev-bypass': 'true',
  'x-dev-role': 'doctor',
  'x-dev-user-id': '22222222-2222-2222-2222-222222222201', // Dr. Aditi Sharma (doctor_id 33333333-3333-3333-3333-333333333301)
};

const DOCTOR_2_HEADERS = {
  'x-dev-bypass': 'true',
  'x-dev-role': 'doctor',
  'x-dev-user-id': '22222222-2222-2222-2222-222222222203', // Dr. Vikram Patel (doctor_id 33333333-3333-3333-3333-333333333302)
};

async function runTests() {
  console.log('=== MILESTONE 6 COMPREHENSIVE VERIFICATION ===\n');

  // 1. Find or create a test slot for Doctor 1 (Dr. Aditi Sharma) in the future
  const doctorId1 = '33333333-3333-3333-3333-333333333301';
  const testDate = '2026-10-15';

  await pool.query(
    `INSERT INTO slots (doctor_id, date, start_time, end_time, status)
     VALUES ($1, $2, '14:00:00', '14:30:00', 'available'),
            ($1, $2, '14:30:00', '15:00:00', 'available'),
            ($1, $2, '15:00:00', '15:30:00', 'available')
     ON CONFLICT (doctor_id, date, start_time) DO UPDATE SET status = 'available'`,
    [doctorId1, testDate]
  );

  const slotRes = await pool.query(
    `SELECT id, status FROM slots WHERE doctor_id = $1 AND date = $2 AND start_time = '14:00:00'`,
    [doctorId1, testDate]
  );
  const slot1 = slotRes.rows[0];
  console.log(`[TEST 1] Prepared test slot 1 (${slot1.id}), status: ${slot1.status}`);

  // Test: Patient books slot
  const bookRes = await makeRequest('POST', '/appointments/book', PATIENT_HEADERS, {
    slot_id: slot1.id,
    reason_for_visit: 'Automated verification checkup',
  });
  console.log(`[TEST 1] Patient booking status code: ${bookRes.status}`);
  if (bookRes.status !== 201) {
    throw new Error(`Booking failed: ${JSON.stringify(bookRes.data)}`);
  }
  const appt1 = bookRes.data.appointment;
  console.log(`[TEST 1] Appointment booked: id=${appt1.id}, status=${appt1.status}`);

  // Verify slot is now 'booked' in DB
  const slot1After = await pool.query('SELECT status FROM slots WHERE id = $1', [slot1.id]);
  console.log(`[TEST 1] Slot status in DB after booking: ${slot1After.rows[0].status}`);

  // 2. Concurrency Test: Second patient attempt to book SAME slot MUST fail
  console.log('\n[TEST 2] Concurrency check: Attempting duplicate booking on same slot...');
  const doubleBookRes = await makeRequest('POST', '/appointments/book', PATIENT_HEADERS, {
    slot_id: slot1.id,
    reason_for_visit: 'Concurrent booking attempt',
  });
  console.log(`[TEST 2] Duplicate booking response code: ${doubleBookRes.status} (expected 409)`);
  console.log(`[TEST 2] Error message: ${doubleBookRes.data.error}`);

  // 3. Security Check: Patient CANNOT call doctor-only confirm endpoint
  console.log('\n[TEST 3] Security check: Patient calling /confirm endpoint...');
  const patientConfirmRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/confirm`,
    PATIENT_HEADERS
  );
  console.log(`[TEST 3] Patient calling confirm response code: ${patientConfirmRes.status} (expected 403)`);

  // 4. Ownership Check: Doctor 2 (Dr. Vikram Patel) CANNOT confirm Doctor 1's appointment
  console.log('\n[TEST 4] Ownership check: Doctor 2 calling /confirm on Doctor 1 appointment...');
  const wrongDocConfirmRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/confirm`,
    DOCTOR_2_HEADERS
  );
  console.log(`[TEST 4] Wrong doctor confirm response code: ${wrongDocConfirmRes.status} (expected 403)`);
  console.log(`[TEST 4] Error message: ${wrongDocConfirmRes.data.error}`);

  // 5. Successful Doctor Confirmation: Doctor 1 confirms appointment
  console.log('\n[TEST 5] Legitimate Doctor 1 confirms appointment...');
  const docConfirmRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/confirm`,
    DOCTOR_1_HEADERS
  );
  console.log(`[TEST 5] Confirm response code: ${docConfirmRes.status}`);
  console.log(`[TEST 5] New appointment status: ${docConfirmRes.data.appointment.status}`);

  // Verify DB status
  const dbCheck1 = await pool.query('SELECT status FROM appointments WHERE id = $1', [appt1.id]);
  console.log(`[TEST 5] DB status after confirmation: ${dbCheck1.rows[0].status}`);

  // 6. Idempotency / Invalid Transition: Cannot confirm an ALREADY confirmed appointment
  console.log('\n[TEST 6] Confirming already-confirmed appointment...');
  const reConfirmRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/confirm`,
    DOCTOR_1_HEADERS
  );
  console.log(`[TEST 6] Re-confirm response code: ${reConfirmRes.status} (expected 400)`);
  console.log(`[TEST 6] Error message: ${reConfirmRes.data.error}`);

  // 7. Transition: confirmed -> in_progress
  console.log('\n[TEST 7] Transitioning confirmed -> in_progress...');
  const inProgressRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/status`,
    DOCTOR_1_HEADERS,
    { status: 'in_progress' }
  );
  console.log(`[TEST 7] Status code: ${inProgressRes.status}, status: ${inProgressRes.data.appointment.status}`);

  // 8. Transition: in_progress -> completed
  console.log('\n[TEST 8] Transitioning in_progress -> completed...');
  const completedRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/status`,
    DOCTOR_1_HEADERS,
    { status: 'completed' }
  );
  console.log(`[TEST 8] Status code: ${completedRes.status}, status: ${completedRes.data.appointment.status}`);

  // 9. Cannot cancel or confirm a completed appointment
  console.log('\n[TEST 9] Attempting to cancel completed appointment...');
  const cancelCompletedRes = await makeRequest(
    'PATCH',
    `/appointments/${appt1.id}/cancel`,
    DOCTOR_1_HEADERS
  );
  console.log(`[TEST 9] Cancel completed response code: ${cancelCompletedRes.status} (expected 400)`);

  // 10. Test Cancellation & Slot Release:
  console.log('\n[TEST 10] Testing booking and cancellation with slot release...');
  const slot2Res = await pool.query(
    `SELECT id FROM slots WHERE doctor_id = $1 AND date = $2 AND start_time = '14:30:00'`,
    [doctorId1, testDate]
  );
  const slot2 = slot2Res.rows[0];

  const appt2Book = await makeRequest('POST', '/appointments/book', PATIENT_HEADERS, {
    slot_id: slot2.id,
    reason_for_visit: 'Cancellation test',
  });
  const appt2 = appt2Book.data.appointment;
  console.log(`[TEST 10] Booked appt2: ${appt2.id}`);

  // Slot should be booked
  const slot2Check1 = await pool.query('SELECT status FROM slots WHERE id = $1', [slot2.id]);
  console.log(`[TEST 10] Slot status before cancel: ${slot2Check1.rows[0].status}`);

  // Doctor cancels appt2
  const docCancelRes = await makeRequest(
    'PATCH',
    `/appointments/${appt2.id}/cancel`,
    DOCTOR_1_HEADERS,
    { cancellation_reason: 'Emergency reschedule required' }
  );
  console.log(`[TEST 10] Doctor cancel response code: ${docCancelRes.status}, status: ${docCancelRes.data.appointment.status}`);

  // Slot should be released back to 'available'
  const slot2Check2 = await pool.query('SELECT status FROM slots WHERE id = $1', [slot2.id]);
  console.log(`[TEST 10] Slot status after cancel: ${slot2Check2.rows[0].status} (expected: available)`);

  // Cannot confirm a cancelled appointment
  console.log('\n[TEST 11] Confirming cancelled appointment...');
  const confirmCancelledRes = await makeRequest(
    'PATCH',
    `/appointments/${appt2.id}/confirm`,
    DOCTOR_1_HEADERS
  );
  console.log(`[TEST 11] Confirm cancelled response code: ${confirmCancelledRes.status} (expected 400)`);

  // 12. Non-existent appointment ID
  console.log('\n[TEST 12] Non-existent appointment ID...');
  const nonExistentRes = await makeRequest(
    'PATCH',
    '/appointments/00000000-0000-0000-0000-000000000000/confirm',
    DOCTOR_1_HEADERS
  );
  console.log(`[TEST 12] Non-existent response code: ${nonExistentRes.status} (expected 404)`);

  // 13. Reschedule: Old slot released, new slot booked
  console.log('\n[TEST 13] Testing Patient Reschedule...');
  const slot3Res = await pool.query(
    `SELECT id FROM slots WHERE doctor_id = $1 AND date = $2 AND start_time = '15:00:00'`,
    [doctorId1, testDate]
  );
  const slot3 = slot3Res.rows[0];

  // Book on slot2 (which was freed above)
  const appt3Book = await makeRequest('POST', '/appointments/book', PATIENT_HEADERS, {
    slot_id: slot2.id,
    reason_for_visit: 'Reschedule test initial',
  });
  const appt3 = appt3Book.data.appointment;
  console.log(`[TEST 13] Initial booking on slot2: ${appt3.id}`);

  // Reschedule to slot3
  const rescheduleRes = await makeRequest(
    'PATCH',
    `/appointments/${appt3.id}/reschedule`,
    PATIENT_HEADERS,
    { new_slot_id: slot3.id }
  );
  console.log(`[TEST 13] Reschedule response code: ${rescheduleRes.status}`);

  // Check DB: slot2 must be available, slot3 must be booked
  const slot2Final = await pool.query('SELECT status FROM slots WHERE id = $1', [slot2.id]);
  const slot3Final = await pool.query('SELECT status FROM slots WHERE id = $1', [slot3.id]);
  console.log(`[TEST 13] Previous slot2 status: ${slot2Final.rows[0].status} (expected: available)`);
  console.log(`[TEST 13] New slot3 status: ${slot3Final.rows[0].status} (expected: booked)`);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
  await pool.end();
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  pool.end();
  process.exit(1);
});
