export const environment = {
  production: false,
  apiBaseUrl: "http://127.0.0.1:3000",
  apiDiagnostics: true,
  auth: {
    defaultUsername: "alejandrina",
    defaultPassword: "alejandrina123"
  },
  supabase: {
    url: "",
    storageUrl: "https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3",
    anonKey: "",
    bucket: "productos",
    productImagesPath: "productos"
  }
} as const;
