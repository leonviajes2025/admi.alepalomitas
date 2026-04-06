import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Contact } from '../models/contact.model';
import { Product, ProductPayload } from '../models/product.model';
import { WhatsappQuote, WhatsappQuoteStatus } from '../models/whatsapp-quote.model';

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
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/productos/activos`);
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.apiBaseUrl}/productos`, payload);
  }

  updateProduct(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http.put<Product>(`${this.apiBaseUrl}/productos/${id}`, payload);
  }

  deleteProduct(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiBaseUrl}/productos/${id}`, {
      activo: false,
      visible: false
    });
  }

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiBaseUrl}/contactos`);
  }

  getWhatsappQuotes(): Observable<WhatsappQuote[]> {
    return this.http
      .get<WhatsappQuoteResponse[]>(`${this.apiBaseUrl}/contactos-whats`)
      .pipe(map((quotes) => quotes.map((quote) => this.normalizeWhatsappQuote(quote))));
  }

  updateWhatsappQuoteStatus(id: number, clienteEstatus: WhatsappQuoteStatus): Observable<WhatsappQuote> {
    return this.http
      .patch<WhatsappQuoteResponse>(`${this.apiBaseUrl}/contactos-whats/${id}`, { clienteEstatus })
      .pipe(map((quote) => this.normalizeWhatsappQuote(quote)));
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
}