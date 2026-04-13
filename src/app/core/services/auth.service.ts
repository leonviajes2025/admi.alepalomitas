import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticatedAdmin, LoginPayload } from '../models/admin-session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly apiBaseUrlNormalized = this.ensureApiPrefix(this.apiBaseUrl);
  private readonly storageKey = 'alepalomitas-admin-session';
  private readonly session = signal<AuthenticatedAdmin | null>(this.restoreSession());

  readonly currentUser = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly currentToken = computed(() => this.session()?.token ?? null);
  readonly defaultCredentials = Object.freeze({
    nombreUsuario: environment.auth.defaultUsername,
    contrasena: environment.auth.defaultPassword
  });

  login(credentials: LoginPayload): Observable<AuthenticatedAdmin> {
    const payload = {
      nombreUsuario: credentials.nombreUsuario.trim(),
      contrasena: credentials.contrasena
    };

    // Hacer la petición indicando `withCredentials: true` para que el navegador acepte
    // la cookie `httpOnly` que el servidor devuelva en `Set-Cookie`.
    return this.http
      .post<unknown>(`${this.apiBaseUrlNormalized}/usuarios-acceso/validar`, payload, {
        observe: 'response' as const,
        withCredentials: true
      })
      .pipe(
        map((resp) => this.normalizeSession(resp.body, payload.nombreUsuario)),
        tap((session) => this.persistSession(session))
      );
  }

  logout(): void {
    this.session.set(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.storageKey);
    }
  }

  private persistSession(session: AuthenticatedAdmin): void {
    this.session.set(session);

    if (typeof window !== 'undefined') {
      // Store session in sessionStorage so token is cleared when the tab is closed
      window.sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private restoreSession(): AuthenticatedAdmin | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawSession = window.sessionStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as unknown;
      return this.normalizeSession(parsedSession);
    } catch {
      window.sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private normalizeSession(response: unknown, fallbackUsername = ''): AuthenticatedAdmin {
    if (typeof response === 'boolean') {
      if (!response) {
        throw new Error('Credenciales invalidas.');
      }

      return {
        id: null,
        nombreUsuario: fallbackUsername,
        nombreCompleto: '',
        tienePermiso: true
      };
    }

    if (!this.isRecord(response)) {
      throw new Error('La respuesta del servicio de acceso no es valida.');
    }

    const nestedUser = this.isRecord(response['usuario']) ? response['usuario'] : null;
    const source = nestedUser ?? response;
    const hasPermission = this.resolvePermission(source, response);

    if (!hasPermission) {
      throw new Error('Tu usuario no tiene permiso para acceder al panel.');
    }

    const nombreUsuario =
      this.readString(source, 'nombreUsuario') ??
      this.readString(response, 'nombreUsuario') ??
      fallbackUsername;

    if (!nombreUsuario) {
      throw new Error('La respuesta del servicio de acceso no incluye un usuario valido.');
    }

    const token = this.readString(response as Record<string, unknown>, 'token');

    return {
      id: this.readNumber(source, 'id') ?? this.readNumber(response, 'id') ?? null,
      nombreUsuario,
      nombreCompleto:
        this.readString(source, 'nombreCompleto') ??
        this.readString(response, 'nombreCompleto') ??
        '',
      tienePermiso: true,
      token: token ?? null
    };
  }

  private resolvePermission(
    primarySource: Record<string, unknown>,
    fallbackSource: Record<string, unknown>
  ): boolean {
    return (
      this.readBoolean(primarySource, 'tienePermiso') ??
      this.readBoolean(fallbackSource, 'tienePermiso') ??
      this.readBoolean(primarySource, 'valido') ??
      this.readBoolean(fallbackSource, 'valido') ??
      this.readBoolean(primarySource, 'autorizado') ??
      this.readBoolean(fallbackSource, 'autorizado') ??
      this.readBoolean(primarySource, 'acceso') ??
      this.readBoolean(fallbackSource, 'acceso') ??
      true
    );
  }

  private readBoolean(source: Record<string, unknown>, key: string): boolean | null {
    const value = source[key];
    return typeof value === 'boolean' ? value : null;
  }

  private readNumber(source: Record<string, unknown>, key: string): number | null {
    const value = source[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private ensureApiPrefix(base: string): string {
    if (!base) return '/api';
    if (/\/api(\/|$)/.test(base)) {
      return base.replace(/\/+$/g, '');
    }
    return base.replace(/\/+$/g, '') + '/api';
  }
}
