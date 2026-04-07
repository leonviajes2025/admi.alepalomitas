import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticatedAdmin, LoginPayload } from '../models/admin-session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly apiKey = (environment as any).privateApiKey ?? (environment as any).PRIVATE_API_KEY ?? (environment as any).apiKey;
  private readonly storageKey = 'alepalomitas-admin-session';
  private readonly session = signal<AuthenticatedAdmin | null>(this.restoreSession());

  readonly currentUser = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly defaultCredentials = Object.freeze({
    nombreUsuario: environment.auth.defaultUsername,
    contrasena: environment.auth.defaultPassword
  });

  // requiere una key en el header x-api-key con el valor de PRIVATE_API_KEY definido en las variables de entorno del servidor (Vercel env, etc.) para seguridad. 
  login(credentials: LoginPayload): Observable<AuthenticatedAdmin> {
    const payload = {
      nombreUsuario: credentials.nombreUsuario.trim(),
      contrasena: credentials.contrasena
    };

    const headers = this.buildHeaders(true);

    return this.http.post<unknown>(`${this.apiBaseUrl}/usuarios-acceso/validar`, payload, headers).pipe(
      map((response) => this.normalizeSession(response, payload.nombreUsuario)),
      tap((session) => this.persistSession(session))
    );
  }

    private buildHeaders(includeApiKey = false): { headers?: HttpHeaders } | {} {
    if (!includeApiKey) {
      return {};
    }

    const apiKey = (environment as any).privateApiKey ?? (environment as any).PRIVATE_API_KEY ?? (environment as any).apiKey;
    if (!apiKey) {
      return {};
    }

    const headers = new HttpHeaders({ 'x-api-key': String(apiKey) });
    return { headers };
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
      window.localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private restoreSession(): AuthenticatedAdmin | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawSession = window.localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as unknown;
      return this.normalizeSession(parsedSession);
    } catch {
      window.localStorage.removeItem(this.storageKey);
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

    return {
      id: this.readNumber(source, 'id') ?? this.readNumber(response, 'id') ?? null,
      nombreUsuario,
      nombreCompleto:
        this.readString(source, 'nombreCompleto') ??
        this.readString(response, 'nombreCompleto') ??
        '',
      tienePermiso: true
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
}
