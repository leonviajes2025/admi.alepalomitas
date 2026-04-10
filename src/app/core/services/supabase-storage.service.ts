import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { getSupabaseClient, hasDirectSupabaseConfig, hasSupabaseConfig } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseStorageService {
  private readonly uploadApiUrl = '/storage-api/upload';
  private readonly deleteApiUrl = '/storage-api/delete';

  isConfigured(): boolean {
    return hasSupabaseConfig();
  }

  async uploadProductImage(file: File): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Configura Supabase antes de intentar subir imagenes.');
    }

    const bucket = environment.supabase.bucket;
    let folder = environment.supabase.productImagesPath.trim().replace(/^\/+|\/+$/g, '');

    // Evita crear una carpeta con el mismo nombre que el bucket (p. ej. "productos/productos").
    if (folder === bucket) {
      folder = '';
    }
    const extension = this.getFileExtension(file.name);
    const fileName = this.sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
    const objectPath = [folder, `${Date.now()}-${crypto.randomUUID()}-${fileName}${extension}`]
      .filter(Boolean)
      .join('/');

    if (!hasDirectSupabaseConfig()) {
      return this.uploadProductImageThroughApi(file);
    }

    const client = getSupabaseClient();
    const { error } = await client.storage.from(bucket).upload(objectPath, file, {
      cacheControl: '3600',
      contentType: file.type || undefined,
      upsert: false
    });

    if (error) {
      throw new Error(error.message || 'No fue posible subir la imagen a Supabase.');
    }

    const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  async deleteProductImageByPublicUrl(publicUrl: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    if (!hasDirectSupabaseConfig()) {
      return this.deleteProductImageThroughApi(publicUrl);
    }

    const objectPath = this.extractObjectPathFromPublicUrl(publicUrl);

    if (!objectPath) {
      return false;
    }

    const client = getSupabaseClient();
    const { error } = await client.storage.from(environment.supabase.bucket).remove([objectPath]);

    if (error) {
      throw new Error(error.message || 'No fue posible eliminar la imagen anterior.');
    }

    return true;
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
      throw new Error(message);
    }

    const payload = (await response.json()) as { publicUrl?: string };

    if (!payload.publicUrl) {
      throw new Error('No fue posible obtener la URL publica de la imagen.');
    }

    return payload.publicUrl;
  }

  private async deleteProductImageThroughApi(publicUrl: string): Promise<boolean> {
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
      throw new Error(message);
    }

    return true;
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

      if (bucket !== environment.supabase.bucket) {
        return null;
      }

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
}