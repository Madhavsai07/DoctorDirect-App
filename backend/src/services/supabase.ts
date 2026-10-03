import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Supabase authentication is not configured.');
  }

  client ??= createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}