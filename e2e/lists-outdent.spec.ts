import { expect, test } from '@/e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

/**
 * `liftListItem` outdents an item into the list above it only when both items
 * are the same type. The shapes below reach its other branch, which lifts the
 * item's content clean out of every list while leaving the marker behind as
 * ordinary text - it then serializes escaped, `\- Second`, and reaches the file
 * as prose reading like a list that no longer is one.
 */
test.describe('Outdenting a list item out of its list', () => {
	test('Shift-Tab on a top-level item leaves the list rather than escaping its marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- First\n- Second')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Second').click())
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'Shift+Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('- First\n\nSecond')
	})

	test('Shift-Tab on a task item nested under a bullet item does not escape its marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- First\n  - [ ] Second')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Second').click())
		await pressKeySettled(page, 'Home')
		for (let index = 0; index < 6; index += 1) {
			await pressKeySettled(page, 'ArrowRight')
		}
		await pressKeySettled(page, 'Shift+Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('- First\n\n  Second')
	})

	test('Enter on a blank task item nested under a bullet item does not escape its marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- First\n  - [ ] Second')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Second').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Enter')
		await pressKeySettled(page, 'Enter')
		await page.keyboard.type('Lifted')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('- First\n  - [ ] Second\n\n  Lifted')
	})
})
