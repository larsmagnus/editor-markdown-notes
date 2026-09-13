import type { Page } from '@playwright/test'

/**
 * Puts the app on the VS Code data path (`useHostDocument`) instead of the
 * standalone demo path, by seeding the globals the real webview host injects
 * before the bundle runs. Must run before `page.goto`.
 *
 * `fileName`'s extension is what `Layout` derives `fileKind` from - default
 * to `notes.md` for specs that don't care, and override it for anything
 * exercising `.txt`/`.mdx`-specific behavior.
 */
export async function openInVSCode(
	page: Page,
	content: string,
	fileName = 'notes.md'
) {
	await page.addInitScript(
		({ initialContent, initialFileName }) => {
			window.vscode = {
				postMessage: () => {},
				getState: () => undefined,
				setState: () => {},
			}
			window.initialContent = initialContent
			window.fileName = initialFileName
		},
		{ initialContent: content, initialFileName: fileName }
	)

	await page.goto('/')
}
