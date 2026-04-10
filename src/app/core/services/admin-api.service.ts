import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Contact } from '../models/contact.model';
import { Product, ProductPayload } from '../models/product.model';
import { WhatsappQuote, WhatsappQuoteStatus } from '../models/whatsapp-quote.model';
import { HttpCacheService } from './http-cache.service';

interface WhatsappQuoteResponse {
  id: number | string;
  nombre?: string | null;
  cotizacion?: string | null;
  fechaEntregaEstimada?: string | null;
  createdAt?: string | null;
  fechaCreacion?: string | null;
  fechaRegistro?: string | null;
  canal?: string | null;
  clienteEstatus?: string | null;
  estado?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly defaultOptions = { withCredentials: true } as const;
  private readonly cache = inject(HttpCacheService);

  // Rutas protegidas que se usan en este proyecto (revisarlista del backend)
  private readonly protectedPrefixes = [
    '/api/contactos',
    '/api/productos',
    '/api/contactos-whats',
    '/api/boton-whats',
    '/api/usuarios-acceso',
    '/api/logs-errores'
  ];

  // Removed authorization logic

  getProducts(): Observable<Product[]> {
    const key = `${this.apiBaseUrl}/productos/activos`;
    return this.cache.getOrSet<Product[]>(key, () =>
      this.http.get<Product[]>(`${this.apiBaseUrl}/productos/activos`, this.defaultOptions).pipe(
        tap((products) => {
          if ((environment as any).apiDiagnostics) {
            // Log para diagnostico: muestra si el backend está filtrando `visible`
            console.debug('[AdminApiService] /productos/activos response:', products);
          }
        })
      )
    );
  }

  // Método utilitario para forzar una consulta directa (sin cache) — útil para depuración
  fetchActiveProductsNoCache(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/productos/activos`, this.defaultOptions).pipe(
      tap((products) => console.debug('[AdminApiService] fetchActiveProductsNoCache:', products))
    );
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    const key = `${this.apiBaseUrl}/productos/activos`;
    const sanitized = this.sanitizeProductPayload(payload);
    return this.http.post<Product>(`${this.apiBaseUrl}/productos`, sanitized, this.defaultOptions).pipe(
      tap(() => this.cache.invalidatePrefix(`${this.apiBaseUrl}/productos`))
    );
  }

  updateProduct(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    const key = `${this.apiBaseUrl}/productos/activos`;
    const sanitized = this.sanitizeProductPayload(payload);
    return this.http.put<Product>(`${this.apiBaseUrl}/productos/${id}`, sanitized, this.defaultOptions).pipe(
      tap(() => this.cache.invalidatePrefix(`${this.apiBaseUrl}/productos`))
    );
  }

  deleteProduct(id: number): Observable<Product> {
    const key = `${this.apiBaseUrl}/productos/activos`;
    return this.http.put<Product>(`${this.apiBaseUrl}/productos/${id}`, {
      activo: false,
      visible: false
    }, this.defaultOptions).pipe(
      tap(() => this.cache.invalidatePrefix(`${this.apiBaseUrl}/productos`))
    );
  }

  getContacts(): Observable<Contact[]> {
    const key = `${this.apiBaseUrl}/contactos`;
    return this.cache.getOrSet<Contact[]>(key, () =>
      this.http.get<Contact[]>(`${this.apiBaseUrl}/contactos`, this.defaultOptions)
    );
  }

  getWhatsappQuotes(): Observable<WhatsappQuote[]> {
    const key = `${this.apiBaseUrl}/contactos-whats`;
    return this.cache.getOrSet<WhatsappQuote[]>(key, () =>
      this.http
        .get<WhatsappQuoteResponse[]>(`${this.apiBaseUrl}/contactos-whats`, this.defaultOptions)
        .pipe(map((quotes) => quotes.map((quote) => this.normalizeWhatsappQuote(quote))))
    );
  }

  updateWhatsappQuoteStatus(id: number, clienteEstatus: WhatsappQuoteStatus): Observable<WhatsappQuote> {
    const key = `${this.apiBaseUrl}/contactos-whats`;
    return this.http
      .patch<WhatsappQuoteResponse>(`${this.apiBaseUrl}/contactos-whats/${id}`, { clienteEstatus }, this.defaultOptions)
      .pipe(
        map((quote) => this.normalizeWhatsappQuote(quote)),
        tap(() => this.cache.invalidate(key))
      );
  }


  private normalizeWhatsappQuote(quote: WhatsappQuoteResponse): WhatsappQuote {
    return {
      id: this.normalizeNumericValue(quote.id),
      nombre: this.normalizeNullableString(quote.nombre),
      cotizacion: this.normalizeNullableString(quote.cotizacion) ?? 'Sin detalle de cotizacion.',
      fechaEntregaEstimada: this.normalizeNullableString(quote.fechaEntregaEstimada),
      canal: this.normalizeNullableString(quote.canal) ?? 'WhatsApp',
      clienteEstatus: this.normalizeWhatsappQuoteStatus(quote.clienteEstatus ?? quote.estado),
      createdAt: this.normalizeNullableString(quote.createdAt ?? quote.fechaCreacion ?? quote.fechaRegistro)
    };
  }

  private normalizeWhatsappQuoteStatus(status: string | null | undefined): WhatsappQuoteStatus {
    const normalizedStatus = status
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    switch (normalizedStatus) {
      case 'respondida':
        return 'respondida';
      case 'en revision':
        return 'en revision';
      default:
        return 'pendiente';
    }
  }

  private normalizeNullableString(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeNumericValue(value: number | string): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private sanitizeProductPayload<T extends ProductPayload | Partial<ProductPayload>>(payload: T): T {
    const copy = { ...(payload as Record<string, unknown>) } as Record<string, unknown>;

    const coerceBoolean = (v: unknown): boolean | undefined => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return Boolean(v);
      if (typeof v === 'string') {
        const normalized = v.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'visible' || normalized === 'activo') return true;
        if (normalized === 'false' || normalized === 'oculto' || normalized === 'inactivo') return false;
        // fall back to JSON-like values
        if (normalized === '1') return true;
        if (normalized === '0') return false;
      }
      return undefined;
    };

    if ('visible' in copy) {
      const coerced = coerceBoolean(copy['visible']);
      if (typeof coerced === 'boolean') copy['visible'] = coerced;
    }

    if ('activo' in copy) {
      const coerced = coerceBoolean(copy['activo']);
      if (typeof coerced === 'boolean') copy['activo'] = coerced;
    }

    return copy as T;
  }
}