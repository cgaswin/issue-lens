import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Issue Lens',
    permissions: ['storage'],
    host_permissions: ['https://api.github.com/*'],
    browser_specific_settings: {
      gecko: {
        id: '{da070c02-e25f-4d92-911e-0899882294e0}',
        strict_min_version: '109.0'
      }
    }
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@/': resolve(__dirname, 'src') + '/',
      },
    },
  }),
});
