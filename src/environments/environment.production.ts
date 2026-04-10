export const environment = {
  production: true,
  apiBaseUrl: "/api",
  apiDiagnostics: false,
  auth: {
    defaultUsername: "",
    defaultPassword: ""
  },
  supabase: {
    url: "",
    storageUrl: "https://qxrchlnqbzcagfazkcgo.storage.supabase.co/storage/v1/s3",
    anonKey: "",
    bucket: "productos",
    productImagesPath: "productos"
  }
} as const;
