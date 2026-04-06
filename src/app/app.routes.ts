import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'productos'
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./features/products/products-page.component').then((module) => module.ProductsPageComponent)
  },
  {
    path: 'contactos',
    loadComponent: () =>
      import('./features/contacts/contacts-page.component').then((module) => module.ContactsPageComponent)
  },
  {
    path: 'cotizaciones-whatsapp',
    loadComponent: () =>
      import('./features/quotes/quotes-page.component').then((module) => module.QuotesPageComponent)
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];