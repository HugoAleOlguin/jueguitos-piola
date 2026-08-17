import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expone en localhost (IPv6), 127.0.0.1 (IPv4) y red local
    port: 5173,
    cors: true
  }
})
