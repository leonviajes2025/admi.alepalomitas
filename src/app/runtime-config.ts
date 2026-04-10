import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  production?: boolean;
  apiBaseUrl?: string;
  apiDiagnostics?: boolean;
  auth?: { defaultUsername?: string; defaultPassword?: string };
  supabase?: { url?: string; storageUrl?: string; anonKey?: string; bucket?: string; productImagesPath?: string };
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

export function readWindowConfig(): RuntimeConfig | null {
  return typeof window !== 'undefined' ? window.__APP_CONFIG__ ?? null : null;
}
