import { defineConfig, devices } from '@playwright/test';

const APP_PORT = 4180;
const SIGNAL_PORT = 9000;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run preview',
      url: `http://127.0.0.1:${APP_PORT}/duel-arena/`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'node server/index.js',
      url: `http://127.0.0.1:${SIGNAL_PORT}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        PORT: String(SIGNAL_PORT),
        PEER_PATH: '/duel-arena',
        PEER_KEY: 'duel-arena-key',
      },
    },
  ],
});
