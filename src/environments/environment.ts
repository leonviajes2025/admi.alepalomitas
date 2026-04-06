export const environment = {
  production: false,
  apiBaseUrl: '/api',
  apiDiagnostics: false,
  supabase: {
    url: '',
    storageUrl: 'https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3',
    anonKey: '',
    bucket: '',
    productImagesPath: 'productos'
  }
} as const;