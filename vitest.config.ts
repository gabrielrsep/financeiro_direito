import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
          setupFiles: ['./test/setup.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          setupFiles: ['./test/setup.ts']
        },
      }),
    ],
  },
})
