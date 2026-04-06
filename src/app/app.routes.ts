import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((module) => module.LoginPageComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'productos'
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/products/products-page.component').then((module) => module.ProductsPageComponent)
  },
  {
    path: 'contactos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contacts/contacts-page.component').then((module) => module.ContactsPageComponent)
  },
  {
    path: 'cotizaciones-whatsapp',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quotes-page.component').then((module) => module.QuotesPageComponent)
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];