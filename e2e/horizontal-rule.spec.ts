import { expect, test } from '@/e2e/lib/fixtures'
import { openInVSCode } from '@/e2e/lib/helpers'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'

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

		await actionSettled(page, () => content.getByText('Above.').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'ArrowDown')

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

		await actionSettled(page, () => content.getByText('Above.').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Enter')
		await page.keyboard.type('---')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Above.\n\n---\n')
	})

	// Matching is anchored to the block's start but stops at the caret, so
	// without a guard this swallows the text after it into a rule.
	test('typing --- in front of existing text makes no rule', async ({
		page,
	}) => {
		await openInVSCode(page, 'Above.')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Above.').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'Home')
		await page.keyboard.type('---')

		await expect(content.locator('[data-type="horizontalRule"]')).toHaveCount(0)
	})
})
