const BASE_URL = 'http://localhost:5001/api/v1';

// Test Actors
const DOC1_USER_ID = '22222222-2222-2222-2222-222222222201'; // Dr. Aditi Sharma (Correct Doctor)
const DOC2_USER_ID = '22222222-2222-2222-2222-222222222203'; // Dr. Vikram Patel (Wrong Doctor)
const PATIENT_USER_ID = '22222222-2222-2222-2222-222222222202'; // Rahul Verma (Correct Patient)

const doc1Headers = {
  'Content-Type': 'application/json',
  'x-dev-bypass': 'true',
  'x-dev-role': 'doctor',
  'x-dev-user-id': DOC1_USER_ID,
};

const doc2Headers = {
  'Content-Type': 'application/json',
  'x-dev-bypass': 'true',
  'x-dev-role': 'doctor',
  'x-dev-user-id': DOC2_USER_ID,
};

const patientHeaders = {
  'Content-Type': 'application/json',
  'x-dev-bypass': 'true',
  'x-dev-role': 'patient',
  'x-dev-user-id': PATIENT_USER_ID,
};

async function request(url: string, options: any = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runMilestone8Verification() {
  console.log('====================================================');
  console.log('   DOCTORDIRECT — MILESTONE 8 E2E VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // 0. Ensure a future slot exists for Doctor 1
    console.log('--- Step 0: Ensure available slot for Doctor 1 ---');
    const tomorrow = new Date(Date.now() + 86400000);
    const fromDate = tomorrow.toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    await request(
      `${BASE_URL}/doctor/33333333-3333-3333-3333-333333333301/slots/generate`,
      {
        method: 'POST',
        headers: doc1Headers,
        body: JSON.stringify({ from_date: fromDate, to_date: nextWeek }),
      }
    );

    // Fetch available future slots
    const slotsRes = await request(
      `${BASE_URL}/doctor/33333333-3333-3333-3333-333333333301/slots?from_date=${fromDate}&to_date=${nextWeek}`,
      { headers: patientHeaders }
    );
    const availableSlots = (slotsRes.data.slots || []).filter(
      (s: any) => s.status === 'available'
    );
    if (availableSlots.length === 0) {
      throw new Error('No available slots found for Doctor 1 to book test appointment');
    }
    const testSlot = availableSlots[0];
    console.log(`✓ Found available future slot: ID ${testSlot.id} on ${testSlot.date} at ${testSlot.start_time}`);

    // 1. Patient books appointment
    console.log('\n--- Step 1: Patient books appointment ---');
    const bookRes = await request(`${BASE_URL}/appointments/book`, {
      method: 'POST',
      headers: patientHeaders,
      body: JSON.stringify({
        slot_id: testSlot.id,
        reason_for_visit: 'Persistent cough and mild fever for 4 days',
      }),
    });
    if (!bookRes.ok) throw new Error(`Booking failed: ${JSON.stringify(bookRes.data)}`);
    const appointmentId = bookRes.data.appointment.id;
    console.log(`✓ Appointment created: ID ${appointmentId}, Status: ${bookRes.data.appointment.status}`);

    // 2. Doctor 1 confirms appointment
    console.log('\n--- Step 2: Doctor confirms appointment ---');
    const confirmRes = await request(`${BASE_URL}/appointments/${appointmentId}/confirm`, {
      method: 'PATCH',
      headers: doc1Headers,
    });
    if (!confirmRes.ok) throw new Error(`Confirm failed: ${JSON.stringify(confirmRes.data)}`);
    console.log(`✓ Appointment confirmed: Status is now ${confirmRes.data.appointment.status}`);

    // 3. Doctor starts consultation
    console.log('\n--- Step 3: Doctor starts consultation ---');
    const startConsultRes = await request(`${BASE_URL}/consultations`, {
      method: 'POST',
      headers: doc1Headers,
      body: JSON.stringify({ appointment_id: appointmentId }),
    });
    if (!startConsultRes.ok) throw new Error(`Start consultation failed: ${JSON.stringify(startConsultRes.data)}`);
    const consultation = startConsultRes.data.consultation;
    const consultationId = consultation.id;
    console.log(`✓ Consultation started: ID ${consultationId}, Status: ${consultation.status}`);

    // 4. Try creating prescription BEFORE consultation completion (MUST fail 400)
    console.log('\n--- Step 4: Verify prescription blocked before consultation completion ---');
    const prematureRes = await request(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: doc1Headers,
      body: JSON.stringify({
        consultationId,
        diagnosis: 'Upper Respiratory Tract Infection',
        medicines: [
          {
            name: 'Amoxicillin 500mg',
            dosage: '1 capsule',
            frequency: 'Three times daily',
            duration: '5 days',
            instructions: 'After meals',
          },
        ],
      }),
    });
    if (prematureRes.status === 400) {
      console.log(`✓ Successfully rejected with HTTP 400: "${prematureRes.data.error}"`);
    } else {
      throw new Error(`Expected HTTP 400 but got ${prematureRes.status}`);
    }

    // 5. Doctor completes consultation
    console.log('\n--- Step 5: Doctor completes consultation ---');
    const completeConsultRes = await request(`${BASE_URL}/consultations/${consultationId}/complete`, {
      method: 'PATCH',
      headers: doc1Headers,
      body: JSON.stringify({
        symptoms: 'Dry cough, low-grade fever 100°F, throat irritation',
        clinical_notes: 'Chest clear bilaterally, throat hyperemic, no tonsillar exudates',
        diagnosis: 'Acute Viral Pharyngitis with secondary bronchospasm',
        treatment_plan: 'Symptomatic relief, hydration, throat gargles',
        follow_up_instructions: 'Review after 5 days if fever persists or symptoms worsen',
      }),
    });
    if (!completeConsultRes.ok) throw new Error(`Complete consultation failed: ${JSON.stringify(completeConsultRes.data)}`);
    console.log(`✓ Consultation completed: Status: ${completeConsultRes.data.consultation.status}`);

    // 6. Doctor creates prescription draft
    console.log('\n--- Step 6: Doctor creates prescription draft with multiple medicines ---');
    const createPresRes = await request(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: doc1Headers,
      body: JSON.stringify({
        consultationId,
        diagnosis: 'Acute Viral Pharyngitis with secondary bronchospasm',
        medicines: [
          {
            name: 'Tab Paracetamol 650mg',
            dosage: '1 tablet',
            frequency: 'Thrice daily',
            duration: '3 days',
            instructions: 'After food for fever/bodyache',
          },
          {
            name: 'Syp Levocetirizine 5mg',
            dosage: '5ml',
            frequency: 'Once daily at bedtime',
            duration: '5 days',
            instructions: 'At bedtime with water',
          },
        ],
        generalAdvice: 'Drink lukewarm water, steam inhalation twice daily, avoid cold drinks.',
      }),
    });
    if (!createPresRes.ok) throw new Error(`Create prescription draft failed: ${JSON.stringify(createPresRes.data)}`);
    const prescription = createPresRes.data.prescription;
    const prescriptionId = prescription.id;
    console.log(`✓ Prescription draft created: ID ${prescriptionId}`);
    console.log(`  is_signed: ${prescription.is_signed}`);
    console.log(`  Medicines count: ${prescription.medicines.length}`);

    // 7. Doctor edits draft (adds a 3rd medicine and updates advice)
    console.log('\n--- Step 7: Doctor edits draft prescription ---');
    const updateDraftRes = await request(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      headers: doc1Headers,
      body: JSON.stringify({
        diagnosis: 'Acute Viral Pharyngitis (Updated diagnosis)',
        medicines: [
          {
            name: 'Tab Paracetamol 650mg',
            dosage: '1 tablet',
            frequency: 'Thrice daily',
            duration: '3 days',
            instructions: 'After food for fever/bodyache',
          },
          {
            name: 'Syp Levocetirizine 5mg',
            dosage: '5ml',
            frequency: 'Once daily at bedtime',
            duration: '5 days',
            instructions: 'At bedtime with water',
          },
          {
            name: 'Lozenges Strepsils',
            dosage: '1 lozenge',
            frequency: 'Every 4-6 hours as needed',
            duration: '3 days',
            instructions: 'Slowly dissolve in mouth',
          },
        ],
        generalAdvice: 'Warm saline gargles thrice daily, rest vocal cords, hydrate well.',
      }),
    });
    if (!updateDraftRes.ok) throw new Error(`Update draft failed: ${JSON.stringify(updateDraftRes.data)}`);
    const updatedPres = updateDraftRes.data.prescription;
    console.log(`✓ Draft updated: Medicines count: ${updatedPres.medicines.length}, Advice updated.`);

    // 8. RBAC Test: Wrong doctor tries to edit draft (MUST fail 403)
    console.log('\n--- Step 8: RBAC Test — Wrong doctor cannot edit draft ---');
    const wrongDocEditRes = await request(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      headers: doc2Headers,
      body: JSON.stringify({ diagnosis: 'Malicious modification by unauthorized doctor' }),
    });
    if (wrongDocEditRes.status === 403) {
      console.log(`✓ Successfully rejected wrong doctor with HTTP 403: "${wrongDocEditRes.data.error}"`);
    } else {
      throw new Error(`Expected HTTP 403 but got ${wrongDocEditRes.status}`);
    }

    // 9. RBAC Test: Patient cannot edit draft (MUST fail 403)
    console.log('\n--- Step 9: RBAC Test — Patient cannot edit draft ---');
    const patientEditRes = await request(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      headers: patientHeaders,
      body: JSON.stringify({ diagnosis: 'Patient self-prescribing' }),
    });
    if (patientEditRes.status === 403) {
      console.log(`✓ Successfully rejected patient edit with HTTP 403: "${patientEditRes.data.error}"`);
    } else {
      throw new Error(`Expected HTTP 403 but got ${patientEditRes.status}`);
    }

    // 10. Doctor finalizes prescription
    console.log('\n--- Step 10: Doctor finalizes prescription ---');
    const finalizeRes = await request(`${BASE_URL}/prescriptions/${prescriptionId}/finalize`, {
      method: 'PATCH',
      headers: doc1Headers,
    });
    if (!finalizeRes.ok) throw new Error(`Finalize failed: ${JSON.stringify(finalizeRes.data)}`);
    const finalizedPres = finalizeRes.data.prescription;
    console.log(`✓ Prescription finalized: is_signed = ${finalizedPres.is_signed}, signed_at = ${finalizedPres.signed_at}`);

    // 11. Immutability Test: Doctor cannot edit finalized prescription (MUST fail 400)
    console.log('\n--- Step 11: Immutability Test — Finalized prescription cannot be modified ---');
    const editFinalizedRes = await request(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      headers: doc1Headers,
      body: JSON.stringify({ diagnosis: 'Attempted edit after finalization' }),
    });
    if (editFinalizedRes.status === 400) {
      console.log(`✓ Successfully blocked edit of finalized prescription with HTTP 400: "${editFinalizedRes.data.error}"`);
    } else {
      throw new Error(`Expected HTTP 400 but got ${editFinalizedRes.status}`);
    }

    // 12. Patient opens prescription
    console.log('\n--- Step 12: Patient reads prescription via consultation endpoint ---');
    const patientReadRes = await request(
      `${BASE_URL}/prescriptions/consultation/${consultationId}`,
      { headers: patientHeaders }
    );
    if (!patientReadRes.ok) throw new Error(`Patient read failed: ${JSON.stringify(patientReadRes.data)}`);
    const readPres = patientReadRes.data.prescription;
    console.log(`✓ Patient retrieved prescription:`);
    console.log(`  Doctor: Dr. ${readPres.doctor_first_name} ${readPres.doctor_last_name} (${readPres.specialization_name})`);
    console.log(`  Diagnosis: ${readPres.diagnosis}`);
    console.log(`  Medicines: ${readPres.medicines.length} medicines prescribed:`);
    readPres.medicines.forEach((m: any, idx: number) => {
      console.log(`    [${idx + 1}] ${m.name} | ${m.dosage} | ${m.frequency} | ${m.duration} | ${m.instructions}`);
    });
    console.log(`  Advice: ${readPres.general_advice}`);
    console.log(`  Signed at: ${readPres.signed_at}`);
    console.log(`  is_signed: ${readPres.is_signed}`);

    // 13. Patient checks prescription history
    console.log('\n--- Step 13: Patient retrieves prescription history ---');
    const historyRes = await request(`${BASE_URL}/prescriptions/patient/history`, {
      headers: patientHeaders,
    });
    if (!historyRes.ok) throw new Error(`History read failed: ${JSON.stringify(historyRes.data)}`);
    const history = historyRes.data.prescriptions;
    console.log(`✓ Patient history returned ${history.length} finalized prescription(s)`);
    const foundInHistory = history.some((p: any) => p.id === prescriptionId);
    console.log(`✓ Newly created prescription exists in patient history: ${foundInHistory}`);

    // 14. RBAC: Wrong doctor cannot access prescription
    console.log('\n--- Step 14: RBAC — Wrong doctor cannot access prescription ---');
    const wrongDocReadRes = await request(
      `${BASE_URL}/prescriptions/${prescriptionId}`,
      { headers: doc2Headers }
    );
    if (wrongDocReadRes.status === 403) {
      console.log(`✓ Successfully blocked wrong doctor read with HTTP 403: "${wrongDocReadRes.data.error}"`);
    } else {
      throw new Error(`Expected HTTP 403 but got ${wrongDocReadRes.status}`);
    }

    console.log('\n====================================================');
    console.log('   ALL MILESTONE 8 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
    process.exit(1);
  }
}

runMilestone8Verification();
