import { expect, test } from '@playwright/test'

import { openInVSCode } from '#e2e/lib/vscode-host'

/**
 * The highlighted mirror (`RawMarkdownHighlight`) sits behind the raw-mode
 * textarea and must wrap text identically to it, or a click lands on a
 * different character than the one the mirror shows at that position.
 */
test.describe('Raw view highlight mirror', () => {
	test('wraps the same as the textarea at the default (non-full-width) column', async ({
		page,
	}) => {
		const longParagraph =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
		const marker = 'TARGET_LINE_MARKER'
		const content = `${longParagraph}\n\n${marker}\n`

		await openInVSCode(page, content)
		await page.getByRole('button', { name: 'Raw editor' }).click()

		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue(content)

		// Full width off is the default (`DEFAULT_VIEW_OPTIONS.fullWidth`), so
		// the reading-measure column is already in effect here.
		const targetIndex = content.indexOf(marker) + marker.length

		const point = await page.evaluate((needle: string) => {
			const pre = document.querySelector('pre[aria-hidden="true"]')
			if (!pre) throw new Error('mirror not found')

			const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
			let node: Text | null
			let offset = 0
			let targetNode: Text | null = null
			let targetOffset = 0
			const end = pre.textContent!.indexOf(needle) + needle.length

			while ((node = walker.nextNode() as Text | null)) {
				const len = node.textContent!.length
				if (targetNode === null && offset <= end && offset + len >= end) {
					targetNode = node
					targetOffset = end - offset
				}
				offset += len
			}

			const range = document.createRange()
			range.setStart(targetNode!, targetOffset)
			range.setEnd(targetNode!, targetOffset)
			const rect = range.getBoundingClientRect()
			return { x: rect.left, y: (rect.top + rect.bottom) / 2 }
		}, marker)

		await page.mouse.click(point.x, point.y)

		const selectionStart = await raw.evaluate(
			(element: HTMLTextAreaElement) => element.selectionStart
		)

		// Clicking where the mirror visibly shows the end of `marker` must place
		// the caret at that same character offset in the real textarea - not
		// wherever the textarea's own, differently-wrapped layout happens to put
		// the point directly underneath.
		expect(selectionStart).toBe(targetIndex)
	})
})
