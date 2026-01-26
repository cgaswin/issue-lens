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
