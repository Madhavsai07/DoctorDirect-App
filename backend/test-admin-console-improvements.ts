import { pool } from './src/db/pool';
import { closeTestClients, createTestAccounts, TestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function testAdminConsoleImprovements(): Promise<void> {
  let admin: TestAccount | undefined;
  let patient: TestAccount | undefined;
  let notificationId: string | undefined;
  let passed = 0;
  let failed = 0;
  const assert = (condition: boolean, message: string): void => {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed += 1;
    } else {
      console.error(`  FAIL: ${message}`);
      failed += 1;
    }
  };

  try {
    const accounts = await createTestAccounts([
      { role: 'admin' },
      { role: 'patient' },
    ]);
    [admin, patient] = accounts;
    const adminAccount = accounts[0];
    const patientAccount = accounts[1];
    const profileResponse = await fetch(`${API_BASE}/auth/me`, { headers: adminAccount.headers });
    const profileBody: any = await profileResponse.json();
    assert(profileResponse.status === 200, `Admin profile endpoint succeeds (got ${profileResponse.status})`);
    assert(profileBody.user?.role === 'admin' && profileBody.user?.email === adminAccount.email,
      'Admin profile uses the authenticated isolated admin account.');

    const listResponse = await fetch(`${API_BASE}/admin/doctors?status=pending`, { headers: adminAccount.headers });
    const listBody: any = await listResponse.json();
    assert(listResponse.status === 200 && Array.isArray(listBody.doctors),
      'Admin can list the pending doctor queue.');

    const notification = await pool.query<{ id: string }>(
      `INSERT INTO notifications (recipient_user_id, type, title, message, event_key, is_read)
       VALUES ($1, 'system_alert', 'Integration test', 'Isolated admin notification test.', $2, FALSE)
       RETURNING id`,
      [adminAccount.applicationUserId, `test-admin-notification-${adminAccount.authUser.id}`]
    );
    notificationId = notification.rows[0].id;

    const listNotifications = await fetch(`${API_BASE}/notifications`, { headers: adminAccount.headers });
    const notificationsBody: any = await listNotifications.json();
    assert(listNotifications.status === 200
      && notificationsBody.notifications.some((item: { id: string }) => item.id === notificationId),
    'Admin notification feed is scoped to and includes the test admin notification.');

    const unread = await fetch(`${API_BASE}/notifications/unread-count`, { headers: adminAccount.headers });
    const unreadBody: any = await unread.json();
    assert(unread.status === 200 && typeof unreadBody.unreadCount === 'number',
      'Admin unread notification count is returned.');

    const markRead = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    const markReadBody: any = await markRead.json();
    assert(markRead.status === 200 && markReadBody.notification?.is_read === true,
      'Admin can mark their own notification as read.');

    const markAll = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(markAll.status === 200, `Admin can mark their notifications as read (got ${markAll.status})`);

    const patientAdmin = await fetch(`${API_BASE}/admin/doctors`, { headers: patientAccount.headers });
    assert(patientAdmin.status === 403, `Patient cannot access admin routes (got ${patientAdmin.status})`);

    const wrongRecipient = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: patientAccount.headers,
    });
    assert(wrongRecipient.status === 404 || wrongRecipient.status === 403,
      `Patient cannot mark another account's notification as read (got ${wrongRecipient.status})`);
  } catch (error) {
    console.error('Admin console integration error:', error);
    failed += 1;
  } finally {
    if (notificationId) await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
    await patient?.cleanup();
    await admin?.cleanup();
    await closeTestClients();
  }

  console.log(`\nAdmin console integration results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

testAdminConsoleImprovements().catch(async (error: unknown) => {
  console.error('Admin console setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
