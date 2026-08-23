import type { Page } from '@playwright/test'

import { focusedElementSignature } from '@/e2e/lib/helpers'

/**
 * Waits for the focus signature to differ from `previous`, using
 * `page.waitForFunction`'s in-browser polling rather than a Node-side loop:
 * Playwright's `press` can fire the next keydown before a just-dispatched
 * ProseMirror transaction's DOM update has landed, reading a still-stale
 * "focus didn't move" - a rate no real Tab-pressing user reaches. Hundreds
 * of Node-side `page.evaluate` round-trips polling for the same thing also
 * measurably starves the page's own event loop.
 *
 * Returns `previous` unchanged once `timeoutMs` elapses with no change - a
 * press that genuinely doesn't move focus (the walk's true end) is expected
 * to time out here, not a failure.
 */
async function waitForFocusChange(
	page: Page,
	previous: string | null,
	timeoutMs: number
): Promise<string | null> {
	const NO_SIGNATURE = ' none '

	const changed = await page
		.waitForFunction<string | false, [string | null, string]>(
			([prev, noSignature]) => {
				const element = document.activeElement
				let signature: string | null = null
				if (element && element !== document.body) {
					const path: number[] = []
					for (
						let node = element;
						node.parentElement;
						node = node.parentElement
					) {
						path.unshift(
							Array.prototype.indexOf.call(node.parentElement.children, node)
						)
					}
					const selection = document.getSelection()
					const caret =
						element.getAttribute('role') === 'textbox' && selection?.anchorNode
							? `${selection.anchorNode.textContent?.slice(0, 20)}@${selection.anchorOffset}`
							: ''
					signature = [
						element.tagName,
						element.getAttribute('role') ?? '',
						element.getAttribute('aria-label') ?? '',
						path.join('.'),
						caret,
					].join('|')
				}
				return signature === prev ? false : (signature ?? noSignature)
			},
			[previous, NO_SIGNATURE] as [string | null, string],
			{ polling: 'raf', timeout: timeoutMs }
		)
		.catch(() => null)

	if (!changed) return previous
	// Resolves only on a truthy return above, so always the `string` branch.
	const value = (await changed.jsonValue()) as string
	return value === NO_SIGNATURE ? null : value
}

/**
 * Presses Tab (Escape first, whenever a plain text caret has real focus) up
 * to `maxPresses` times, recording the focus signature after each settles,
 * until a press stops moving focus or `maxPresses` is reached. Duplicates
 * are left in on purpose: a test asserting on the list directly is what
 * catches focus looping rather than continuing to a new stop.
 */
export async function collectTabWalk(
	page: Page,
	maxPresses = 200,
	settleTimeoutMs = 2000
): Promise<string[]> {
	const signatures: string[] = []
	let previous = await focusedElementSignature(page)

	for (let i = 0; i < maxPresses; i++) {
		const onTextCaret = await page.evaluate(
			() => document.activeElement?.getAttribute('role') === 'textbox'
		)
		if (onTextCaret) await page.keyboard.press('Escape')
		await page.keyboard.press('Tab')

		const signature = await waitForFocusChange(page, previous, settleTimeoutMs)
		if (signature === previous) break // Walk's natural end.
		if (signature === null) break // Focus left the page.

		signatures.push(signature)
		previous = signature
	}

	return signatures
}
