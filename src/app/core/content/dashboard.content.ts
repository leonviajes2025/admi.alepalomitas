export interface NavigationItem {
  label: string;
  description: string;
  path: string;
}

export interface MetricCard {
  label: string;
  value: string;
  caption: string;
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

export const DASHBOARD_METRICS: MetricCard[] = [
  {
    label: 'Vista',
    value: '3',
    caption: 'Secciones operativas disponibles.'
  },
  {
    label: 'Arquitectura',
    value: 'Standalone',
    caption: 'Sin NgModules ni dependencias UI externas.'
  },
  {
    label: 'Datos',
    value: 'REST',
    caption: 'HttpClient contra la API descrita en Postman.'
  },
  {
    label: 'Deploy',
    value: 'Vercel',
    caption: 'Salida estatica lista para dist/.../browser.'
  }
];