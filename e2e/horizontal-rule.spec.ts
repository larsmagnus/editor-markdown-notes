import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * A horizontal rule's `---` is real text like every other construct's syntax,
 * so the caret reaches it, it reveals, and editing it away leaves a paragraph.
 */
test.describe('A horizontal rule in the live editor', () => {
	test('hides its own syntax while the caret is elsewhere', async ({
		page,
	}) => {
		await openInVSCode(page, 'Above.\n\n---\n\nBelow.')
		const content = page.getByRole('textbox').first()
		const rule = content.locator('[data-type="horizontalRule"]')

		await content.getByText('Above.').click()

		await expect(rule).toBeVisible()
		await expect(rule.locator('.syntax-hidden')).toHaveCount(1)
	})

	test('reveals its syntax once the caret reaches it', async ({ page }) => {
		await openInVSCode(page, 'Above.\n\n---\n\nBelow.')
		const content = page.getByRole('textbox').first()
		const rule = content.locator('[data-type="horizontalRule"]')

		await content.getByText('Above.').click()
		await page.keyboard.press('End')
		await page.keyboard.press('ArrowDown')

		await expect(rule.locator('.syntax-hidden')).toHaveCount(0)
		await expect(rule).toHaveText('---')
	})

	test('round-trips through the raw view unchanged', async ({ page }) => {
		await openInVSCode(page, 'Above.\n\n---\n\nBelow.')

		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Above.\n\n---\n\nBelow.')
	})

	test('typing --- on its own line makes a rule', async ({ page }) => {
		await openInVSCode(page, 'Above.')
		const content = page.getByRole('textbox').first()

		await content.getByText('Above.').click()
		await page.keyboard.press('End')
		await page.keyboard.press('Enter')
		await page.keyboard.type('---')

		await expect(content.locator('[data-type="horizontalRule"]')).toHaveCount(1)
	})
})
