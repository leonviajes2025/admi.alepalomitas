import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    window.localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  it('should validate credentials against the usuarios-acceso endpoint', () => {
    service.login({ nombreUsuario: 'alejandrina', contrasena: 'alejandrina123' }).subscribe((session) => {
      expect(session.nombreUsuario).toBe('alejandrina');
      expect(session.tienePermiso).toBeTrue();
      expect(service.isAuthenticated()).toBeTrue();
    });

    const request = httpMock.expectOne('/api/usuarios-acceso/validar');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombreUsuario: 'alejandrina',
      contrasena: 'alejandrina123'
    });

    request.flush({
      id: 1,
      nombreUsuario: 'alejandrina',
      nombreCompleto: 'Alejandrina Demo',
      tienePermiso: true
    });
  });

  it('should expose local default credentials in development', () => {
    expect(service.defaultCredentials.nombreUsuario).toBe('alejandrina');
    expect(service.defaultCredentials.contrasena).toBe('alejandrina123');
  });

  it('should clear the stored session on logout', () => {
    service.login({ nombreUsuario: 'alejandrina', contrasena: 'alejandrina123' }).subscribe();

    const request = httpMock.expectOne('/api/usuarios-acceso/validar');
    request.flush({ nombreUsuario: 'alejandrina', tienePermiso: true });

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(window.localStorage.getItem('alepalomitas-admin-session')).toBeNull();
  });
});
