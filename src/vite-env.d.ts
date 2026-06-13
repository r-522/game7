/// <reference types="vite/client" />

// Augment Vite's ImportMetaEnv with our custom environment variables.
// Add any new VITE_* vars here to get full type safety.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
