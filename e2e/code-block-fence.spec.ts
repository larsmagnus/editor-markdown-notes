import { expect, test } from '@/e2e/lib/fixtures'
import { openInVSCode } from '@/e2e/lib/helpers'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'

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
		await actionSettled(page, () => content.getByText('const x = 1').click())
		await pressKeySettled(page, 'ArrowUp')
		await pressKeySettled(page, 'Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		// Which character the caret was on is the browser's business; what
		// matters is that one of the tag's went and the block did not.
		await expect(raw).toHaveValue(/^```javascr\w*\nconst x = 1\n```/)
		await expect(raw).not.toHaveValue(/javascript/)
	})

	// Backspace at the very start of the fence line means "this is not a code
	// block", so the fences go and the code stays. Left to the stock handler the
	// block becomes a paragraph still holding its ``` lines as literal text -
	// which markdown-it reads straight back as a code block, so the unwrap
	// silently undoes itself on the next load.
	test('backspacing at the fence start unwraps to the code alone', async ({
		page,
	}) => {
		await openInVSCode(page, '```ts\nconst a = 1\n```')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('const a = 1').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'ArrowUp')
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('const a = 1')
	})

	test('Mod-Alt-c still toggles a code block on', async ({ page }) => {
		await openInVSCode(page, 'const total = 1')
		const content = page.getByRole('textbox').first()

		await content.getByText('const total = 1').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('ControlOrMeta+Alt+c')

		await expect(content.locator('pre')).toHaveCount(1)
	})

	// Regression: returning only a `Backspace` entry from
	// `addKeyboardShortcuts` replaces the stock map wholesale rather than adding
	// to it, which took triple-Enter-to-exit with it and left a keyboard trap.
	test('triple Enter at the end still exits the block', async ({ page }) => {
		await openInVSCode(page, '```ts\nconst a = 1\n```')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('const a = 1').click())
		await expect(content).toBeFocused()
		// The block's last line is its closing fence, so the caret has to get
		// past the code line first - `End` alone stops at the end of that line.
		await pressKeySettled(page, 'ArrowDown')
		await pressKeySettled(page, 'End')
		for (let index = 0; index < 3; index += 1) {
			await pressKeySettled(page, 'Enter')
		}
		await page.keyboard.type('after')

		await expect(content.locator('p', { hasText: 'after' })).toHaveCount(1)
	})

	test('backspacing at the closing fence does not grow another one', async ({
		page,
	}) => {
		await openInVSCode(page, '```js\nconst x = 1\n```')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('const x = 1').click())
		await pressKeySettled(page, 'ArrowDown')
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/``\n```/)
	})
})
