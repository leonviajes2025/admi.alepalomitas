import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { validateLogErrorCreateInput, ValidationResult } from './validation';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class LogsApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly apiBaseUrlNormalized = this.ensureApiPrefix(this.apiBaseUrl);
  private readonly defaultOptions = { withCredentials: true } as const;

  constructor(private http: HttpClient) {}

  createLogError(payload: any): Observable<any> {
    const body = { ...payload };

    if (body.metodo && typeof body.metodo === 'string') {
      body.metodo = body.metodo.toUpperCase();
    }

    const validation: ValidationResult = validateLogErrorCreateInput(body);
    if (!validation.valid) {
      return throwError(() => ({ status: 400, errors: validation.errors }));
    }

    return this.http.post<any>(`${this.apiBaseUrlNormalized}/logs-errores`, body, this.defaultOptions);
  }

  private ensureApiPrefix(base: string): string {
    if (!base) return '/api';
    if (/\/api(\/|$)/.test(base)) {
      return base.replace(/\/+$/g, '');
    }
    return base.replace(/\/+$/g, '') + '/api';
  }
}
