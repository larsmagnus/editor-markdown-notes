import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

/**
 * The browser-drawn bullet or number stands in for the `- ` or `1. ` the item
 * actually holds, exactly as a task item's checkbox stands in for its `[ ]`.
 * Both on screen at once reads as `• - Buy milk`.
 */
test.describe('A list item marker in the live editor', () => {
	test('draws the bullet while the marker is hidden', async ({ page }) => {
		await openInVSCode(page, '- Buy milk\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const item = content.locator('li').first()

		await content.getByText('Body text.').click()

		await expect(item.locator('.syntax-hidden')).toHaveCount(1)
		await expect(item).toHaveCSS('list-style-type', 'disc')
	})

	test('drops the bullet once the marker is revealed', async ({ page }) => {
		await openInVSCode(page, '- Buy milk\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const item = content.locator('li').first()

		await actionSettled(page, () => item.getByText('Buy milk').click())
		await pressKeySettled(page, 'Home')

		await expect(item.locator('.syntax-hidden')).toHaveCount(0)
		await expect(item).toHaveCSS('list-style-type', 'none')
	})

	test('drops the number once an ordered marker is revealed', async ({
		page,
	}) => {
		await openInVSCode(page, '1. Buy milk\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const item = content.locator('li').first()

		await actionSettled(page, () => item.getByText('Buy milk').click())
		await pressKeySettled(page, 'Home')

		await expect(item).toHaveCSS('list-style-type', 'none')
	})
})
