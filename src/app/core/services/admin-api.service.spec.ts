/// <reference types="jasmine" />

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AdminApiService } from './admin-api.service';

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
      expect(products.length).toBe(1);
      expect(products[0].nombre).toBe('Producto demo');
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
        activo: true
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
});