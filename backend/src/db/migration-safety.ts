const productionBlockedCommands = new Set(['down', 'reset', 'seed']);

export function assertMigrationCommandAllowed(command: string, nodeEnv: string): void {
  if (nodeEnv === 'production' && productionBlockedCommands.has(command)) {
    throw new Error(
      `[Migrations] The "${command}" command is disabled in production. Use a reviewed, forward-only migration.`
    );
  }
}
