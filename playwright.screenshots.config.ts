import { defineConfig } from '@playwright/test'

/**
 * Not part of `pnpm test:e2e`: these specs write the README's images, so
 * running them with the suite would rewrite tracked files on every test run.
 * Serves the same standalone build as `playwright.config.ts`.
 */
export default defineConfig({
	testDir: './e2e/screenshots',
	testMatch: '*.screenshots.ts',
	webServer: {
		command: 'pnpm build:web && pnpm preview',
		url: 'http://localhost:4173',
		reuseExistingServer: true,
		timeout: 120_000,
	},
	use: { baseURL: 'http://localhost:4173' },
})
