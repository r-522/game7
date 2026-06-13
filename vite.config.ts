import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Manually split heavy chunks so the initial JS bundle stays lean.
        // Game assets (.glb, audio) are loaded at runtime from Supabase Storage — NOT bundled here.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          physics: ['@react-three/rapier'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
