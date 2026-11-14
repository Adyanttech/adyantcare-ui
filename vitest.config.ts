import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Kept apart from vite.config.ts so the production build never needs the test packages.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: false,
  },
});
