import { defineConfig, devices } from '@playwright/test';

const port = process.env.TEST_PORT || 3007;
const serverPort = process.env.TEST_SERVER_PORT || 3008;
const reuseServer = process.env.TEST_REUSE_SERVER === 'true';
// Default to mock agent mode for deterministic E2E runs (no external Claude dependency).
// Set `AUTOMAKER_MOCK_AGENT=false` to force real provider calls during tests.
const mockAgent = process.env.AUTOMAKER_MOCK_AGENT === 'false' ? false : true;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(reuseServer
    ? {}
    : {
        webServer: [
          // Backend server - run built server for stability during E2E
          {
            command: `cd ../server && npm run build && npm run start`,
            url: `http://localhost:${serverPort}/api/health`,
            reuseExistingServer: false,
            timeout: 60000,
            env: {
              ...process.env,
              PORT: String(serverPort),
              // Enable mock agent in CI to avoid real API calls
              AUTOMAKER_MOCK_AGENT: mockAgent ? 'true' : 'false',
              // No ALLOWED_ROOT_DIRECTORY restriction - allow all paths for testing
            },
          },
          // Frontend server - use preview to avoid HMR/esbuild flakiness in tests
          {
            command: `npm run build && npm run preview -- --port ${port} --strictPort`,
            url: `http://localhost:${port}`,
            reuseExistingServer: false,
            timeout: 180000,
            env: {
              ...process.env,
              VITE_SKIP_SETUP: 'true',
              // Skip electron plugin during dev (build always includes electron outputs)
              VITE_SKIP_ELECTRON: 'true',
            },
          },
        ],
      }),
});
