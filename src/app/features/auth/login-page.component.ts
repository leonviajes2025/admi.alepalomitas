import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly redirectUrl = this.resolveRedirectUrl();
  private readonly defaults = this.authService.defaultCredentials;

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hasDefaultCredentials = Boolean(
    this.defaults.nombreUsuario && this.defaults.contrasena
  );

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    nombreUsuario: [this.defaults.nombreUsuario, [Validators.required, Validators.maxLength(80)]],
    contrasena: [this.defaults.contrasena, [Validators.required, Validators.maxLength(120)]]
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(this.redirectUrl);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  private resolveRedirectUrl(): string {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');

    if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
      return '/productos';
    }

    return redirectTo;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'Usuario o contrasena incorrectos.';
      }

      if (error.status >= 500) {
        return 'El servicio de acceso no esta disponible en este momento.';
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible validar el acceso.';
  }
}
