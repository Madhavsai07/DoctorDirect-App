import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { appStorage } from './storageAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const storage = {
  getItem: (key: string) => appStorage.getItem(key),
  setItem: (key: string, value: string) => appStorage.setItem(key, value),
  removeItem: (key: string) => appStorage.deleteItem(key),
};

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add its URL and publishable key to mobile/.env.');
  }
  return supabase;
}