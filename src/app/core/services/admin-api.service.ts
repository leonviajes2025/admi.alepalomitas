import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MOCK_WHATSAPP_QUOTES } from '../content/mock-whatsapp-quotes.content';
import { Contact } from '../models/contact.model';
import { Product, ProductPayload } from '../models/product.model';
import { WhatsappQuote } from '../models/whatsapp-quote.model';

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
    return of(MOCK_WHATSAPP_QUOTES);
  }
}