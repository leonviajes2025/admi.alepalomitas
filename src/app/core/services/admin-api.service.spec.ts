/// <reference types="jasmine" />

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AdminApiService } from './admin-api.service';
import { WhatsappQuoteStatus } from '../models/whatsapp-quote.model';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminApiService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request products from the API base url', () => {
    service.getProducts().subscribe((products) => {
      // Debe retornar productos activos incluso si vienen con visible: false
      expect(products.length).toBe(1);
      expect(products[0].nombre).toBe('Producto demo');
      expect(products[0].activo).toBeTrue();
      expect(products[0].visible).toBeFalse();
    });

    const request = httpMock.expectOne('/api/productos/activos');
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 1,
        nombre: 'Producto demo',
        categoria: 'Snacks',
        descripcion: 'Descripcion',
        precio: '120.00',
        imagenUrl: 'https://example.com/demo.jpg',
        activo: true,
        visible: false
      }
    ]);
  });

  it('should soft delete a product by disabling activo and visible', () => {
    service.deleteProduct(7).subscribe((product) => {
      expect(product.activo).toBeFalse();
      expect(product.visible).toBeFalse();
    });

    const request = httpMock.expectOne('/api/productos/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      activo: false,
      visible: false
    });

    request.flush({
      id: 7,
      nombre: 'Producto demo',
      categoria: 'Snacks',
      descripcion: 'Descripcion',
      precio: '120.00',
      imagenUrl: 'https://example.com/demo.jpg',
      activo: false,
      visible: false
    });
  });

  it('should request whatsapp quotes from the contactos-whats endpoint and normalize status', () => {
    service.getWhatsappQuotes().subscribe((quotes) => {
      expect(quotes.length).toBe(1);
      expect(quotes[0].clienteEstatus).toBe('en revision');
      expect(quotes[0].canal).toBe('WhatsApp');
    });

    const request = httpMock.expectOne('/api/contactos-whats');
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 12,
        nombre: 'Cliente demo',
        cotizacion: 'Quiero 40 bolsas',
        fechaEntregaEstimada: '2026-04-20',
        clienteEstatus: 'En revision',
        createdAt: '2026-04-06T12:00:00.000Z'
      }
    ]);
  });

  it('should update whatsapp quote status through the contactos-whats endpoint', () => {
    const nextStatus: WhatsappQuoteStatus = 'respondida';

    service.updateWhatsappQuoteStatus(8, nextStatus).subscribe((quote) => {
      expect(quote.clienteEstatus).toBe(nextStatus);
    });

    const request = httpMock.expectOne('/api/contactos-whats/8');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ clienteEstatus: nextStatus });

    request.flush({
      id: 8,
      nombre: 'Cliente demo',
      cotizacion: 'Quiero una cotizacion actualizada',
      fechaEntregaEstimada: null,
      clienteEstatus: 'respondida',
      canal: 'WhatsApp',
      createdAt: '2026-04-06T12:00:00.000Z'
    });
  });
});