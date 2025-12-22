import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@ui': path.resolve(__dirname, '../src/components/ui'),
      '@3d': path.resolve(__dirname, '../src/components/3d'),
      '@sections': path.resolve(__dirname, '../src/components/sections'),
      '@layout': path.resolve(__dirname, '../src/components/layout'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@data': path.resolve(__dirname, '../src/data'),
      '@assets': path.resolve(__dirname, '../src/assets'),
      '@styles': path.resolve(__dirname, '../src/styles'),
      '@pages': path.resolve(__dirname, '../src/pages')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'animation-vendor': ['framer-motion', 'gsap']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
