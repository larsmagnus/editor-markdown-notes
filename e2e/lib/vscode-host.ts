import type { Page } from '@playwright/test'

/**
 * Puts the app on the VS Code data path (`useHostDocument`) instead of the
 * standalone demo path, by seeding the globals the real webview host injects
 * before the bundle runs. Must run before `page.goto`.
 */
export async function openInVSCode(page: Page, content: string) {
	await page.addInitScript((initialContent) => {
		window.vscode = {
			postMessage: () => {},
			getState: () => undefined,
			setState: () => {},
		}
		window.initialContent = initialContent
		window.fileName = 'notes.md'
	}, content)

	await page.goto('/')
}
