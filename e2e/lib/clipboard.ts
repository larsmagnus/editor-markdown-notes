import type { Locator } from '@playwright/test'

/**
 * Pastes `text` as the clipboard's text flavour, the way another
 * application's content arrives. A real `Control+V` doesn't reliably fire a
 * native paste event in Chromium under Playwright, so this dispatches one
 * directly.
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

/**
 * The `text/html` the editor itself puts on the clipboard for the current
 * selection, captured by dispatching a real `copy` event rather than written
 * out by hand - what an in-editor copy actually produces is the whole point of
 * the tests that use this.
 */
export async function copySelectionHtml(locator: Locator): Promise<string> {
	return locator.evaluate((element) => {
		let html = ''
		const event = new ClipboardEvent('copy', {
			bubbles: true,
			cancelable: true,
		})
		Object.defineProperty(event, 'clipboardData', {
			value: {
				clearData: () => {},
				getData: () => '',
				setData: (type: string, value: string) => {
					if (type === 'text/html') html = value
				},
			},
		})
		element.dispatchEvent(event)
		return html
	})
}

/** Pastes both clipboard flavours, the way content from another editor arrives. */
export async function pasteHtml(locator: Locator, html: string, text: string) {
	await locator.evaluate(
		(element, { html, text }) => {
			const event = new ClipboardEvent('paste', {
				bubbles: true,
				cancelable: true,
			})
			Object.defineProperty(event, 'clipboardData', {
				value: {
					getData: (type: string) =>
						type === 'text/html' ? html : type === 'text/plain' ? text : '',
					types: ['text/html', 'text/plain'],
				},
			})
			element.dispatchEvent(event)
		},
		{ html, text }
	)
}
