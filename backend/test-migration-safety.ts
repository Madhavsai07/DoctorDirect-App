import assert from 'node:assert/strict';
import { assertMigrationCommandAllowed } from './src/db/migration-safety';

for (const command of ['down', 'reset', 'seed']) {
  assert.throws(
    () => assertMigrationCommandAllowed(command, 'production'),
    /disabled in production/
  );
  assert.doesNotThrow(() => assertMigrationCommandAllowed(command, 'development'));
}

assert.doesNotThrow(() => assertMigrationCommandAllowed('up', 'production'));
assert.doesNotThrow(() => assertMigrationCommandAllowed('status', 'production'));
console.log('Production migration safety checks passed.');
