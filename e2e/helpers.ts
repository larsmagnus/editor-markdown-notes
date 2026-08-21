import type { Locator, Page } from '@playwright/test'

/**
 * Puts the app on the VS Code data path (`useHostDocument`) instead of the
 * standalone demo path, by seeding the globals the real webview host injects
 * before the bundle runs (`webview-html.ts`). Must run before `page.goto`.
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

/**
 * Pastes `text` as the clipboard's text flavour, the way another
 * application's content arrives. A real `Control+V` doesn't reliably fire a
 * native paste event in Chromium under Playwright, so this dispatches one
 * directly - the same technique `table/paste.test.ts` uses at the unit level.
 */
export async function pasteText(locator: Locator, text: string) {
	await locator.evaluate((element, text) => {
		const event = new ClipboardEvent('paste', {
			bubbles: true,
			cancelable: true,
		})
		Object.defineProperty(event, 'clipboardData', {
			value: { getData: (type: string) => (type === 'text/plain' ? text : '') },
		})
		element.dispatchEvent(event)
	}, text)
}
