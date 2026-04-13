import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { LogsApiService } from './logs.service';

import { environment } from '../../../environments/environment';
import { getSupabaseClient, hasDirectSupabaseConfig, hasSupabaseConfig } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseStorageService {
  private readonly uploadApiUrl = '/storage-api/upload';
  private readonly deleteApiUrl = '/storage-api/delete';

  constructor(private logsApi: LogsApiService) {}

  isConfigured(): boolean {
    return hasSupabaseConfig();
  }

  async uploadProductImage(file: File): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Configura Supabase antes de intentar subir imagenes.');
    }

    const extension = this.getFileExtension(file.name);
    const fileName = this.sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));

    // Object path composed by server-side; keep client-side filename generation
    // minimal and delegate actual upload to backend API to keep secrets server-side.
    return this.uploadProductImageThroughApi(file);
  }

  async deleteProductImageByPublicUrl(publicUrl: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    // Always use backend API to perform deletions so Supabase secrets are kept on the server.
    return this.deleteProductImageThroughApi(publicUrl);
  }

  async validateProductImageUpload(publicUrl: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Configura Supabase antes de validar imagenes.');
    }

    const objectPath = this.extractObjectPathFromPublicUrl(publicUrl);

    if (!objectPath) {
      throw new Error('La imagen no quedo asociada al bucket configurado en Supabase.');
    }

    const headResponse = await fetch(publicUrl, {
      method: 'HEAD',
      cache: 'no-store'
    }).catch(() => null);

    if (headResponse?.ok) {
      return;
    }

    const getResponse = await fetch(publicUrl, {
      method: 'GET',
      cache: 'no-store'
    }).catch(() => null);

    if (!getResponse?.ok) {
      throw new Error('La imagen se subio, pero no fue posible confirmar su disponibilidad en el bucket de Supabase.');
    }
  }

  private async uploadProductImageThroughApi(file: File): Promise<string> {
    const apiOrigin = this.getApiOrigin(this.uploadApiUrl);
    try {
      const response = await fetch(this.uploadApiUrl, {
        method: 'POST',
        headers: {
          'content-type': file.type || 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name)
        },
        body: file
      });

      if (!response.ok) {
        const message = await this.readApiErrorMessage(response, 'No fue posible subir la imagen.');
        // Enviar log de error, pero no impedir rethrow
        try {
          await lastValueFrom(this.logsApi.createLogError({
            dominio: apiOrigin,
            mensaje: message,
            origen: 'SupabaseStorageService.uploadProductImageThroughApi',
            metodo: 'POST',
            codigo: response.status,
            detalle: undefined,
            contexto: { fileName: file.name },
            fechaOcurrencia: new Date().toISOString()
          }));
        } catch {
          // Ignorar errores al enviar el log
        }

        throw new Error(message);
      }

      const payload = (await response.json()) as { publicUrl?: string };

      if (!payload.publicUrl) {
        const message = 'No fue posible obtener la URL publica de la imagen.';
        try {
          await lastValueFrom(this.logsApi.createLogError({
            dominio: apiOrigin,
            mensaje: message,
            origen: 'SupabaseStorageService.uploadProductImageThroughApi',
            metodo: 'POST',
            contexto: { fileName: file.name },
            fechaOcurrencia: new Date().toISOString()
          }));
        } catch {}

        throw new Error(message);
      }

      return payload.publicUrl;
    } catch (err: any) {
      if (!(err instanceof Error)) {
        err = new Error(String(err));
      }
      // Si ocurre un fallo en fetch (network), loguearlo
      try {
        await lastValueFrom(this.logsApi.createLogError({
          dominio: apiOrigin,
          mensaje: err.message || 'Error desconocido al subir imagen',
          origen: 'SupabaseStorageService.uploadProductImageThroughApi',
          metodo: 'POST',
          detalle: err.stack,
          fechaOcurrencia: new Date().toISOString()
        }));
      } catch {}

      throw err;
    }
  }

  private async deleteProductImageThroughApi(publicUrl: string): Promise<boolean> {
    const apiOrigin = this.getApiOrigin(this.deleteApiUrl);
    try {
      const response = await fetch(this.deleteApiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ publicUrl })
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        const message = await this.readApiErrorMessage(response, 'No fue posible eliminar la imagen anterior.');
        try {
          await lastValueFrom(this.logsApi.createLogError({
            dominio: apiOrigin,
            mensaje: message,
            origen: 'SupabaseStorageService.deleteProductImageThroughApi',
            metodo: 'POST',
            codigo: response.status,
            contexto: { publicUrl },
            fechaOcurrencia: new Date().toISOString()
          }));
        } catch {}

        throw new Error(message);
      }

      return true;
    } catch (err: any) {
      if (!(err instanceof Error)) {
        err = new Error(String(err));
      }
      try {
        await lastValueFrom(this.logsApi.createLogError({
          dominio: apiOrigin,
          mensaje: err.message || 'Error desconocido al eliminar imagen',
          origen: 'SupabaseStorageService.deleteProductImageThroughApi',
          metodo: 'POST',
          detalle: err.stack,
          contexto: { publicUrl },
          fechaOcurrencia: new Date().toISOString()
        }));
      } catch {}

      throw err;
    }
  }

  private async readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  private getFileExtension(fileName: string): string {
    const extension = fileName.match(/\.[^.]+$/)?.[0]?.toLowerCase();
    return extension || '.jpg';
  }

  private extractObjectPathFromPublicUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const publicObjectIndex = pathSegments.findIndex(
        (segment, index) => segment === 'object' && pathSegments[index + 1] === 'public'
      );

      if (publicObjectIndex === -1) {
        return null;
      }

      const bucket = pathSegments[publicObjectIndex + 2];

      const objectPath = pathSegments.slice(publicObjectIndex + 3).join('/');
      return objectPath ? decodeURIComponent(objectPath) : null;
    } catch {
      return null;
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'producto';
  }

  private getApiOrigin(endpoint: string): string {
    try {
      return new URL(endpoint, window.location.href).origin;
    } catch {
      return (window.location && window.location.origin) || '';
    }
  }

}