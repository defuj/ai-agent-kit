import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['bin/**/*.mjs'],
      exclude: ['bin/init.mjs'],
    },
  },
});
