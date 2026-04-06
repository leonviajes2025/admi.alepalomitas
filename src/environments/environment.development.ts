export const environment = {
  production: false,
  apiBaseUrl: "/api",
  apiDiagnostics: true,
  supabase: {
    url: "",
    storageUrl: "https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3",
    anonKey: "",
    bucket: "productos",
    productImagesPath: "productos"
  }
} as const;
