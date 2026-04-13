export const environment = {
  production: false,
  apiBaseUrl: "http://localhost:3000",
  apiDiagnostics: true,
  auth: {
    defaultUsername: "alejandrina",
    defaultPassword: "libreria123"
  },
  supabase: {
    storageUrl: "https://qxrchlnqbzcagfazkcgo.storage.supabase.co/storage/v1/s3"
  }
} as const;
