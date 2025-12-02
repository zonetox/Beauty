// FIX: The reference to "vite/client" was causing an error, likely due to a misconfiguration in the user's environment.
// To resolve this, the reference is removed and the essential types for Vite's `import.meta.env` are defined manually.
// This ensures that `import.meta.env` is correctly typed without relying on the external type definition file.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // You can define other environment variables here as needed

  // Vite-specific environment variables
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
