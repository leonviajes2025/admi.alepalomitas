import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { validateLogErrorCreateInput, ValidationResult } from './validation';

@Injectable({ providedIn: 'root' })
export class LogsApiService {
  private baseUrl = '/api';

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

    return this.http.post<any>(`${this.baseUrl}/logs-errores`, body);
  }
}
