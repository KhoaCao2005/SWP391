// playwright.config.js
import { defineConfig } from '@playwright/test';

// Playwright ESM config for Vite app
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.{js,jsx,ts,tsx}'],
  fullyParallel: true,
  use: {
    headless: false,
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // Start Vite before running tests so baseURL is available
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});