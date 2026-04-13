import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StorageApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly apiBaseUrlNormalized = this.ensureApiPrefix(this.apiBaseUrl);
  private readonly uploadUrl = `${this.apiBaseUrlNormalized}/storage/upload`;
  private readonly deleteUrl = `${this.apiBaseUrlNormalized}/storage/delete`;

  isConfigured(): boolean {
    return true;
  }

  async uploadProductImage(file: File, filename?: string): Promise<string> {
    const form = new FormData();
    form.append('file', file);

    if (filename) {
      form.append('filename', filename);
    }

    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      let message = 'No fue posible subir la imagen.';
      try {
        const payload = await response.json();
        message = payload?.error || message;
      } catch {}
      throw new Error(message);
    }

    const payload = (await response.json()) as { path?: string; url?: string };

    if (payload.url) {
      return payload.url;
    }

    if (payload.path) {
      const base = environment.supabase.storageUrl.replace(/\/+$/,'');
      // `payload.path` already contains the object path returned by the server.
      return `${base}/${payload.path}`;
    }

    throw new Error('Respuesta inválida al subir la imagen.');
  }

  async deleteProductImageByPublicUrl(publicUrl: string): Promise<boolean> {
    const objectPath = this.extractObjectPathFromPublicUrl(publicUrl);

    if (!objectPath) {
      return false;
    }

    const response = await fetch(this.deleteUrl, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: objectPath })
    });

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      let message = 'No fue posible eliminar la imagen.';
      try {
        const payload = await response.json();
        message = payload?.error || message;
      } catch {}
      throw new Error(message);
    }

    return true;
  }

  async validateProductImageUpload(publicUrl: string): Promise<void> {
    const headResponse = await fetch(publicUrl, { method: 'HEAD', cache: 'no-store' }).catch(() => null);

    if (headResponse?.ok) {
      return;
    }

    const getResponse = await fetch(publicUrl, { method: 'GET', cache: 'no-store' }).catch(() => null);

    if (!getResponse?.ok) {
      throw new Error('La imagen se subio, pero no fue posible confirmar su disponibilidad en el bucket.');
    }
  }

  private ensureApiPrefix(base: string): string {
    if (!base) return '/api';
    if (/\/api(\/|$)/.test(base)) {
      return base.replace(/\/+$/g, '');
    }
    return base.replace(/\/+$/g, '') + '/api';
  }

  private extractObjectPathFromPublicUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);

      const publicObjectIndex = pathSegments.findIndex(
        (segment, index) => segment === 'object' && pathSegments[index + 1] === 'public'
      );

      if (publicObjectIndex !== -1) {
        const bucket = pathSegments[publicObjectIndex + 2];

        // If a bucket is present in the URL, return the object path regardless
        // of the configured bucket (project no longer exposes a bucket config).
        const objectPath = pathSegments.slice(publicObjectIndex + 3).join('/');
        return objectPath ? decodeURIComponent(objectPath) : null;
      }

      // Fallback: return the last path segment as object path.
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment ? decodeURIComponent(lastSegment) : null;
    } catch {
      return null;
    }
  }
}
