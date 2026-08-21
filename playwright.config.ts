import { defineConfig } from '@playwright/test'

/**
 * Drives the standalone build in a real browser - the one thing neither
 * `vitest` (renders source directly, not the built bundle) nor the VS Code
 * extension test suite (no DOM access into a custom editor's webview) can
 * check: what the app actually renders after a production build.
 */
export default defineConfig({
	testDir: './e2e',
	webServer: {
		command: 'pnpm build:web && pnpm preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
	use: {
		baseURL: 'http://localhost:4173',
	},
})
