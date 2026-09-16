import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Lists split by a deleted item', () => {
	test('backspacing away the blank line left behind joins the lists back up', async ({
		page,
	}) => {
		await openInVSCode(page, '- One\n- Two\n- Three')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () =>
			content.locator('li', { hasText: 'Two' }).click()
		)
		await pressKeySettled(page, 'End')
		for (let i = 0; i < 'Two'.length; i++) {
			await pressKeySettled(page, 'Backspace')
		}
		// First Backspace unwraps the marker, second removes the blank line between lists.
		await pressKeySettled(page, 'Backspace')
		await pressKeySettled(page, 'Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('- One\n- Three')
	})
})
