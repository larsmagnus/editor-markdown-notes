import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

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
 * Duplicated into `tab-walk.ts`'s `page.waitForFunction` call, which runs
 * entirely in the browser and can't call this function.
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
