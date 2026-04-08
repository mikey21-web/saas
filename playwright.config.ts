import { defineConfig, devices } from '@playwright/test'

const isCheckly = !!process.env.CHECKLY;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: isCheckly ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: isCheckly ? true : false,
    trace: isCheckly ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'checkly',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['chromium'],
    },
  ],
})

