import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Links in the live editor', () => {
	test('a parsed link saves back out unchanged', async ({ page }) => {
		await openInVSCode(page, 'Read [the notes](https://example.com) first.')
		const content = page.getByRole('textbox').first()

		await expect(content.locator('a')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read [the notes](https://example.com) first.')
	})

	test('the [ ]( ) delimiters are hidden while the caret is elsewhere, and reveal when it enters the link', async ({
		page,
	}) => {
		await openInVSCode(page, 'Read [the notes](https://example.com) first.')
		const content = page.getByRole('textbox').first()
		const link = content.locator('a')
		const delimiters = link.locator('.syntax-hidden')
		const before = content.getByText('Read', { exact: false }).first()

		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)

		await link.click()
		await expect(delimiters).toHaveCount(0)

		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)
	})

	test('editing the revealed URL text directly changes what gets saved', async ({
		page,
	}) => {
		await openInVSCode(page, 'Read [the notes](https://old.example.com) first.')
		const content = page.getByRole('textbox').first()
		const link = content.locator('a')

		// Clicking the link reveals `](https://old.example.com)`. Wait for both
		// the editor's own focus and the reveal to actually land before
		// navigating by keyboard, or a click that hasn't settled yet races the
		// keys that follow - which land in the browser's default caret position
		// instead (see `keyboard-navigation.spec.ts`'s own comment on the same
		// race with Escape/Tab).
		await link.click()
		await expect(content).toBeFocused()
		await expect(link.locator('.syntax-hidden')).toHaveCount(0)

		// Walk the caret back from the line's end to just after `old`
		// (`.example.com) first.` is 20 characters) and select it (3
		// characters, backward) to replace just that token.
		await page.keyboard.press('End')
		for (let i = 0; i < 20; i += 1) await page.keyboard.press('ArrowLeft')
		await page.keyboard.down('Shift')
		for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowLeft')
		await page.keyboard.up('Shift')
		await page.keyboard.type('new')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read [the notes](https://new.example.com) first.')
	})
})
