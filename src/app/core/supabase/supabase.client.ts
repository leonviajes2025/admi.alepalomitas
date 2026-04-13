import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

let supabaseClient: SupabaseClient | null = null;

function resolveProjectUrl(): string {
  const supabase = (environment as any).supabase;

  if (!supabase?.storageUrl) {
    return '';
  }

  try {
    const storageUrl = new URL(supabase.storageUrl);
    const projectRef = storageUrl.hostname.split('.storage.supabase.co')[0];

    return projectRef ? `https://${projectRef}.supabase.co` : '';
  } catch {
    return '';
  }
}

export function hasSupabaseConfig(): boolean {
  return Boolean(resolveProjectUrl());
}

export function hasDirectSupabaseConfig(): boolean {
  // Direct client usage requires an anon key; project no longer provides anonKey.
  return false;
}

export function getSupabaseClient(): SupabaseClient {
  throw new Error('Direct Supabase client is not available in this build (anon key removed). Use server-side storage API instead.');
}