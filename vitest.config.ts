import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  test: {
    fileParallelism: true,
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
})
