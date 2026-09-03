import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

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

/** Presses Tab until `locator` is focused, or fails once `maxPresses` is hit. */
export async function tabUntilFocused(
	page: Page,
	locator: Locator,
	maxPresses = 25
) {
	for (let i = 0; i < maxPresses; i++) {
		if (
			await locator.evaluate((element) => element === document.activeElement)
		) {
			return
		}
		await page.keyboard.press('Tab')
	}
	await expect(locator).toBeFocused()
}

/**
 * A stable identity for whichever element has focus, or `null` once focus
 * has left the page: tag, role, accessible name, and its path of child
 * indices from `<body>` - not on-screen position, since `scrollIntoView`
 * can land two different elements at the same viewport offset.
 *
 * The editor's own `role="textbox"` root repeats this path for every caret
 * position inside it, so a walk legitimately revisits it between widgets -
 * the caret's own anchor node/offset disambiguates that one case.
 *
 * Duplicated into `tab-walk.ts`'s `page.waitForFunction` call: that
 * predicate runs entirely in the browser and can't call this function.
 */
export async function focusedElementSignature(
	page: Page
): Promise<string | null> {
	return page.evaluate(() => {
		const element = document.activeElement
		if (!element || element === document.body) return null

		const path: number[] = []
		for (let node = element; node.parentElement; node = node.parentElement) {
			path.unshift(
				Array.prototype.indexOf.call(node.parentElement.children, node)
			)
		}

		const selection = document.getSelection()
		const caret =
			element.getAttribute('role') === 'textbox' && selection?.anchorNode
				? `${selection.anchorNode.textContent?.slice(0, 20)}@${selection.anchorOffset}`
				: ''

		return [
			element.tagName,
			element.getAttribute('role') ?? '',
			element.getAttribute('aria-label') ?? '',
			path.join('.'),
			caret,
		].join('|')
	})
}
