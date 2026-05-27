import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/code/code.ts',
        'src/ui/main.tsx',
        'src/**/types.ts',
        'src/shared/messages.ts',
        // Phase A throwaway — excluded until Phase C TDD rebuild
        'src/ui/ColorEngine.tsx',
        'src/ui/Palette.tsx',
        'src/ui/Swatch.tsx',
        'src/ui/useColors.ts',
        'src/ui/constants.ts',
        'src/code/figmaIdempotent.ts',
        'src/code/applyPalette.ts',
      ],
    },
  },
})
