export const environment = {
  production: true,
  apiBaseUrl: "/api",
  apiDiagnostics: false,
  supabase: {
    url: "",
    storageUrl: "https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3",
    anonKey: "",
    bucket: "productos",
    productImagesPath: "productos"
  }
} as const;
