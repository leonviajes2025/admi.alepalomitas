import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { RUNTIME_CONFIG, readWindowConfig } from './app/runtime-config';

async function loadRuntimeConfig(): Promise<Record<string, unknown> | null> {
  // Prefer a config already injected into window (e.g., by server-side injection)
  const win = readWindowConfig();
  if (win) return win as Record<string, unknown>;

  try {
    const resp = await fetch('/config.json', { cache: 'no-store' });
    if (!resp.ok) return null;
    const json = await resp.json();
    // expose globally for debugging/other scripts
    (window as any).__APP_CONFIG__ = json;
    return json as Record<string, unknown>;
  } catch {
    return null;
  }
}

loadRuntimeConfig()
  .then((cfg) => {
    const mergedConfig = cfg ?? {};
    const mergedAppConfig = {
      ...appConfig,
      providers: [...(appConfig.providers ?? []), { provide: RUNTIME_CONFIG, useValue: mergedConfig }]
    };

    return bootstrapApplication(AppComponent, mergedAppConfig);
  })
  .catch((error: unknown) => {
    console.error(error);
  });