import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

let supabaseClient: SupabaseClient | null = null;

function resolveSupabaseKey(): string {
  return environment.supabase.anonKey || '';
}

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
  return Boolean(resolveProjectUrl() && environment.supabase.bucket);
}

export function hasDirectSupabaseConfig(): boolean {
  return Boolean(resolveProjectUrl() && resolveSupabaseKey() && environment.supabase.bucket);
}

export function getSupabaseClient(): SupabaseClient {
  const projectUrl = resolveProjectUrl();
  const supabaseKey = resolveSupabaseKey();

  if (!projectUrl || !supabaseKey) {
    throw new Error('Falta configurar la URL o una clave valida de Supabase.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(projectUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}