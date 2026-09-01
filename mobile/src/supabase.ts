import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.');
}

const CHUNK_SIZE = 1800;

const secureStorage = {
  async getItem(key: string) {
    const countRaw = await SecureStore.getItemAsync(`${key}:count`);
    if (!countRaw) return null;
    const count = Number(countRaw);
    if (!Number.isSafeInteger(count) || count < 0) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}:${index}`)),
    );
    if (chunks.some((chunk) => chunk === null)) return null;
    return chunks.join('');
  },
  async setItem(key: string, value: string) {
    const previousCountRaw = await SecureStore.getItemAsync(`${key}:count`);
    const previousCount = previousCountRaw ? Number(previousCountRaw) : 0;
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [];
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}:${index}`, chunk)));
    for (let index = chunks.length; index < previousCount; index += 1) {
      await SecureStore.deleteItemAsync(`${key}:${index}`);
    }
    await SecureStore.setItemAsync(`${key}:count`, String(chunks.length));
  },
  async removeItem(key: string) {
    const countRaw = await SecureStore.getItemAsync(`${key}:count`);
    const count = countRaw ? Number(countRaw) : 0;
    await Promise.all(
      Array.from({ length: Number.isSafeInteger(count) && count > 0 ? count : 0 }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:${index}`),
      ),
    );
    await SecureStore.deleteItemAsync(`${key}:count`);
  },
};

export const supabase = createClient(supabaseUrl, publishableKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
