import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Formatting delimiters in the live editor', () => {
	test('typing "**bold**" creates real bold text and saves it back out unchanged', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('Some **bold** text')

		await expect(content.locator('strong')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Some **bold** text')
	})

	test('typing "~~strike~~" creates real strikethrough text and saves it back out unchanged', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('Some ~~struck~~ text')

		await expect(content.locator('s')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Some ~~struck~~ text')
	})

	test('the ** delimiters are hidden while the caret is elsewhere, and reveal when it enters the run', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some **bold** text')
		const content = page.getByRole('textbox').first()
		const strong = content.locator('strong')
		const delimiters = strong.locator('.syntax-hidden')
		// The plain "Some " text before the bold run - clicking the paragraph
		// itself can land inside the run if its centre happens to overlap it.
		const before = content.getByText('Some', { exact: false }).first()

		// Hiding wraps each delimiter in a `.syntax-hidden` decoration span;
		// revealing removes that decoration entirely, so the check is the
		// span's presence, not its visibility (it no longer exists once
		// revealed, so `toBeVisible()` on it would just time out).
		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)

		await strong.click()
		await expect(delimiters).toHaveCount(0)

		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)
	})
})
