import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Deleting a list item down to empty in the live editor', () => {
	// Distinct from backspace-boundaries.spec.ts's marker-boundary case: this
	// deletes the item's *content* character by character, never touching the
	// marker directly, until the item is empty - a separate path into
	// list-marker-sync-plugin.ts's repair step than
	// list-marker-backspace-extension.ts's marker-boundary keymap covers.
	test('bullet list: deleting an item down to empty character by character does not duplicate the marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- Eggs')
		const content = page.getByRole('textbox').first()

		await content.locator('li').click()
		await page.keyboard.press('End')
		for (let i = 0; i < 'Eggs'.length; i++) {
			await page.keyboard.press('Backspace')
			await page.waitForTimeout(100)
		}

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('- ')
	})
})
