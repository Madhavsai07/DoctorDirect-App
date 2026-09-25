import config from './config/env';
import createApp from './app';

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
});
