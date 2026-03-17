import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: {
    postcss: '',
  },
  test: {
    passWithNoTests: true,
    css: false,
  },
});
