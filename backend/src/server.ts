import config from './config/env';
import createApp from './app';
import { notificationService } from './services/notification.service';

/**
 * DoctorDirect — Backend Server Entry Point
 *
 * Bootstraps the Express application and starts the HTTP listener.
 * Database connections (PostgreSQL) will be established here
 * in the Database milestone.
 */
const app = createApp();

app.listen(config.port, () => {
  console.log(
    `[DoctorDirect] Server running on port ${config.port} (${config.nodeEnv})`,
  );
  console.log(`[DoctorDirect] Health: http://localhost:${config.port}/health`);
  // In-app reminders are idempotent at the database level, so restarts and
  // repeated intervals cannot duplicate an appointment reminder.
  notificationService.createUpcomingAppointmentReminders().catch((err) =>
    console.error('[Notifications] Initial reminder check failed:', err)
  );
  setInterval(() => {
    notificationService.createUpcomingAppointmentReminders().catch((err) =>
      console.error('[Notifications] Reminder check failed:', err)
    );
  }, 15 * 60 * 1000).unref();
});
