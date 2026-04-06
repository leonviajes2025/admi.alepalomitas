import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

let supabaseClient: SupabaseClient | null = null;

function resolveProjectUrl(): string {
  if (environment.supabase.url) {
    return environment.supabase.url;
  }

  if (!environment.supabase.storageUrl) {
    return '';
  }

  try {
    const storageUrl = new URL(environment.supabase.storageUrl);
    const projectRef = storageUrl.hostname.split('.storage.supabase.co')[0];

    return projectRef ? `https://${projectRef}.supabase.co` : '';
  } catch {
    return '';
  }
}

export function hasSupabaseConfig(): boolean {
  return Boolean(resolveProjectUrl() && environment.supabase.anonKey && environment.supabase.bucket);
}

export function getSupabaseClient(): SupabaseClient {
  const projectUrl = resolveProjectUrl();

  if (!projectUrl || !environment.supabase.anonKey) {
    throw new Error('Falta configurar la URL o la anon key de Supabase.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(projectUrl, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}