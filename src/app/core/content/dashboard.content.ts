export interface NavigationItem {
  label: string;
  description: string;
  path: string;
}

export const APP_NAVIGATION: NavigationItem[] = [
  {
    label: 'Productos',
    description: 'CRUD completo del catalogo principal.',
    path: '/productos'
  },
  {
    label: 'Contactos',
    description: 'Lectura y busqueda para el formulario web.',
    path: '/contactos'
  },
  {
    label: 'Cotizaciones WhatsApp',
    description: 'Vista mock mientras se habilita el endpoint final.',
    path: '/cotizaciones-whatsapp'
  }
];
