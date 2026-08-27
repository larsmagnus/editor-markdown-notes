import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * The checkbox stands in for the `- [ ] ` the item actually holds, so exactly
 * one of the two is ever on screen.
 */
test.describe('A task item marker in the live editor', () => {
	test('shows the checkbox while the marker is hidden', async ({ page }) => {
		await openInVSCode(page, '- [ ] Buy milk\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const item = content.locator('[data-type="taskItem"]').first()

		await content.getByText('Body text.').click()

		await expect(item.getByRole('checkbox')).toBeVisible()
		await expect(item.locator('.syntax-hidden')).toHaveCount(1)
	})

	test('hides the checkbox once the marker is revealed', async ({ page }) => {
		await openInVSCode(page, '- [ ] Buy milk\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const item = content.locator('[data-type="taskItem"]').first()

		await item.getByText('Buy milk').click()
		await page.keyboard.press('Home')

		await expect(item.locator('.syntax-hidden')).toHaveCount(0)
		await expect(item.getByRole('checkbox')).toHaveCount(0)
	})
})
