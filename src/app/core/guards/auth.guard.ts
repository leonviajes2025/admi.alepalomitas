import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { redirectTo: state.url } : undefined
  });
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.createUrlTree(['/productos']) : true;
};
