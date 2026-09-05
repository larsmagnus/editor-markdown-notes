import { expect, test } from '@/e2e/lib/fixtures'
import { openInVSCode } from '@/e2e/lib/helpers'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'

test.describe('Deleting a list item down to empty in the live editor', () => {
	// Distinct from backspace-boundaries.spec.ts's marker-boundary case: this
	// deletes the item's *content* character by character, never touching the
	// marker directly, until the item is empty - a separate path into
	// the marker sync plugin's repair step than
	// block-marker/marker-backspace-extension.ts's boundary keymap covers.
	test('bullet list: deleting an item down to empty character by character does not duplicate the marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- Eggs')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('li').click())
		await pressKeySettled(page, 'End')
		for (let i = 0; i < 'Eggs'.length; i++) {
			await pressKeySettled(page, 'Backspace')
		}

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('- ')
	})
})
