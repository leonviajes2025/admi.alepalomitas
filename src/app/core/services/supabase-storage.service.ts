import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { getSupabaseClient, hasSupabaseConfig } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseStorageService {
  isConfigured(): boolean {
    return hasSupabaseConfig();
  }

  async uploadProductImage(file: File): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Configura Supabase antes de intentar subir imagenes.');
    }

    const bucket = environment.supabase.bucket;
    const folder = environment.supabase.productImagesPath.trim().replace(/^\/+|\/+$/g, '');
    const extension = this.getFileExtension(file.name);
    const fileName = this.sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
    const objectPath = [folder, `${Date.now()}-${crypto.randomUUID()}-${fileName}${extension}`]
      .filter(Boolean)
      .join('/');

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