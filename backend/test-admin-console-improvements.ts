import { pool } from './src/db/pool';

const API_BASE = 'http://localhost:5001/api/v1';

async function testAdminConsoleImprovements() {
  console.log('=== Testing Admin Console Improvements ===\n');
  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  FAIL: ${msg}`);
      failed++;
    }
  }

  const adminToken = 'Bearer dev-token-madhavsaikiran2007@gmail.com';
  const patientToken = 'Bearer dev-token-dev.patient@doctordirect.com';

  try {
    // 1. Test Admin Auth / Profile retrieval
    console.log('[1] Testing Admin Profile API...');
    const profileRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: adminToken },
    });
    assert(profileRes.status === 200, `Admin /auth/me returns 200 OK (got ${profileRes.status})`);
    const profileData: any = await profileRes.json();
    assert(profileData.user?.role === 'admin', `User role is 'admin' (got ${profileData.user?.role})`);
    assert(
      profileData.user?.email === 'madhavsaikiran2007@gmail.com',
      `Admin email matches (got ${profileData.user?.email})`
    );

    // 2. Test Admin Notifications API (Scoped to Admin)
    console.log('\n[2] Testing Admin Notifications API...');
    const notifRes = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: adminToken },
    });
    assert(notifRes.status === 200, `Admin notifications list returns 200 OK (got ${notifRes.status})`);
    const notifData: any = await notifRes.json();
    assert(Array.isArray(notifData.notifications), 'Response has notifications array');

    const countRes = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: adminToken },
    });
    assert(countRes.status === 200, `Admin unread count returns 200 OK (got ${countRes.status})`);
    const countData: any = await countRes.json();
    assert(typeof countData.unreadCount === 'number', `Unread count is a number (got ${countData.unreadCount})`);

    // 3. Test Notification Creation & Mark Read
    console.log('\n[3] Testing Admin Notification lifecycle...');
    const adminUserRes = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'madhavsaikiran2007@gmail.com'"
    );
    const adminId = adminUserRes.rows[0].id;

    // Insert a test notification for the admin
    const insertNotif = await pool.query<{ id: string }>(
      `INSERT INTO notifications (recipient_user_id, type, title, message, event_key, is_read)
       VALUES ($1, 'system_alert', 'Doctor Verification Alert', 'Dr. New Applicant has submitted credentials for review.', $2, FALSE)
       RETURNING id`,
      [adminId, `admin_alert_${Date.now()}`]
    );
    const testNotifId = insertNotif.rows[0].id;

    const notifWithNewRes = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: adminToken },
    });
    const notifWithNewData: any = await notifWithNewRes.json();
    const foundNotif = notifWithNewData.notifications.some((n: any) => n.id === testNotifId);
    assert(foundNotif, 'Inserted notification is returned in admin notifications list');

    // Mark single notification read
    const markReadRes = await fetch(`${API_BASE}/notifications/${testNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: adminToken },
    });
    assert(markReadRes.status === 200, `Mark notification read returns 200 (got ${markReadRes.status})`);
    const markReadData: any = await markReadRes.json();
    assert(markReadData.notification?.is_read === true, 'Notification is_read is now true');

    // Mark all read
    const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: adminToken },
    });
    assert(markAllRes.status === 200, `Mark all read returns 200 (got ${markAllRes.status})`);

    // Clean up test notification
    await pool.query('DELETE FROM notifications WHERE id = $1', [testNotifId]);

    // 4. Verify Non-Admin Access Restrictions
    console.log('\n[4] Verifying patient cannot access admin endpoints...');
    const patientAdminRes = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: patientToken },
    });
    assert(patientAdminRes.status === 403, `Patient is blocked with 403 Forbidden on admin endpoints (got ${patientAdminRes.status})`);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

testAdminConsoleImprovements();
