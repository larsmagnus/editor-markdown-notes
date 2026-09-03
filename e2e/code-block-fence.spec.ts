import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * A code block's fences are real text, so they are edited like any other text.
 * Deleting one takes the block apart; editing the language tag on the same
 * line does not, that tag being ordinary content the highlighter reads back.
 */
test.describe('A code block fence in the live editor', () => {
	test('backspacing in the language tag edits it, leaving the block', async ({
		page,
	}) => {
		await openInVSCode(page, '```javascript\nconst x = 1\n```')
		const content = page.getByRole('textbox').first()

		// Clicking the fence line directly is unreliable while it is still
		// collapsed to zero width - the caret has to be in the block first.
		await content.getByText('const x = 1').click()
		await page.keyboard.press('ArrowUp')
		// ProseMirror's DOMObserver batches native-arrow selection changes, so a
		// press landing immediately after another can read a stale selection.
		await page.waitForTimeout(100)
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		// Which character the caret was on is the browser's business; what
		// matters is that one of the tag's went and the block did not.
		await expect(raw).toHaveValue(/^```javascr\w*\nconst x = 1\n```/)
		await expect(raw).not.toHaveValue(/javascript/)
	})

	test('backspacing at the closing fence does not grow another one', async ({
		page,
	}) => {
		await openInVSCode(page, '```js\nconst x = 1\n```')
		const content = page.getByRole('textbox').first()

		await content.getByText('const x = 1').click()
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('End')
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/``\n```/)
	})
})
