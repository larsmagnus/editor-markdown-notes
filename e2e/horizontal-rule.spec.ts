import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * Horizontal rule is a single-line, contentless leaf node with no
 * attributes and no variable content - there is nothing to reveal as
 * editable text the way every other construct's marker/delimiter carries
 * information (see the plan doc). This is verification only: confirm the
 * stock node's input rules and round-trip behave, per construct.
 */
test.describe('Horizontal rule in the live editor', () => {
	for (const marker of ['---', '***', '___']) {
		test(`typing "${marker}" on its own line creates a horizontal rule and saves it back out unchanged`, async ({
			page,
		}) => {
			await openInVSCode(page, 'Above the break\n\nBelow the break')
			const content = page.getByRole('textbox').first()

			await content.getByText('Below the break').click()
			await page.keyboard.press('Home')
			await page.keyboard.type(marker)
			await page.keyboard.press('Enter')

			await expect(content.locator('hr')).toBeVisible()

			await page.getByRole('button', { name: 'Raw editor' }).click()
			await expect(
				page.getByRole('textbox', { name: 'Raw markdown' })
			).toHaveValue('Above the break\n\n---\n\nBelow the break')
		})
	}

	test('a parsed horizontal rule saves back out unchanged', async ({
		page,
	}) => {
		const markdown = ['Above the break', '', '---', '', 'Below the break'].join(
			'\n'
		)
		await openInVSCode(page, markdown)
		const content = page.getByRole('textbox').first()

		await expect(content.locator('hr')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(markdown)
	})
})
