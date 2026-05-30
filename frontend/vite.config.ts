import path from 'path';

import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
      plugins: [react(), svgr()],
      base: './',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
  });