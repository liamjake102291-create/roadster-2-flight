import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  workers: 1,
  reporter: 'line',
  webServer: {
    command: 'npm run dev -- --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    reuseExistingServer: true,
    timeout: 30000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5187',
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(edgePath) ? edgePath : undefined),
      args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
});

