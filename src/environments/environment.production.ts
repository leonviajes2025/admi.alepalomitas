export const environment = {
  production: true,
  apiBaseUrl: "/api",
  apiDiagnostics: true,
  supabase: {
    url: "https://mrdwszirgvmrwwinepta.supabase.co",
    storageUrl: "https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3",
    anonKey: "sb_publishable_rQn63F_ZjdtyklzM_O-Xqw_Q9CWhUXp",
    bucket: "productos",
    productImagesPath: "productos"
  }
} as const;
