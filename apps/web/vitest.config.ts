import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/routeTree.gen.ts',
        'src/components/ui/**',
        'src/styles.css',
        'src/lib/auth-client.ts',
        'src/lib/query-client.ts',
        'src/lib/logger.ts',
        'src/router.tsx',
        'src/components/NotFoundComponent.tsx',
        'src/routes/api/auth/**',
        'src/routes/index.tsx',
        'src/routes/__root.tsx',
        'src/routes/login/index.tsx',
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
