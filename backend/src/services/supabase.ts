import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/env';

let client: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Supabase authentication is not configured.');
  }

  client ??= createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase Storage administration is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the backend environment.');
  }

  adminClient ??= createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}