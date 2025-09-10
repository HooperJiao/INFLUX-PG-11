import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import alias from '@rollup/plugin-alias'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    alias({
      entries: [
        { find: '@components', replacement: resolve(__dirname, 'src/components') },
        { find: '@utils', replacement: resolve(__dirname, 'src/utils') },
        { find: '@api', replacement: resolve(__dirname, 'src/api') },
        { find: '@views', replacement: resolve(__dirname, 'src/views') },
        { find: '@layouts', replacement: resolve(__dirname, 'src/layouts') },
        { find: '@assets', replacement: resolve(__dirname, 'src/assets') },
      ],
    }),
  ],
})
