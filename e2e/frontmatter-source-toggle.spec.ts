import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

const NOTE = '---\nname: notes\n---\n\nBody text.'

/**
 * Frontmatter reveals its own `---` fences on caret entry, the same as every
 * other construct - it has no separate raw-source mode. That is what keeps its
 * YAML highlighted and its line breaks intact: both come from the real editable
 * content, which a read-only mirror of the text cannot carry.
 */
test.describe('Frontmatter source reveal in the live editor', () => {
	test('hides the fences while the caret is elsewhere', async ({ page }) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')

		await content.getByText('Body text.').click()

		await expect(frontmatter.locator('.syntax-hidden')).toHaveCount(2)
	})

	test('reveals the fences once the caret moves in', async ({ page }) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')

		await frontmatter.locator('pre').click()

		await expect(frontmatter.locator('.syntax-hidden')).toHaveCount(0)
		await expect(frontmatter).toContainText('---')
	})

	test('"Edit source" moves the caret in, revealing the fences', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')

		await frontmatter
			.getByRole('button', { name: 'Edit frontmatter source' })
			.click()

		await expect(frontmatter.locator('.syntax-hidden')).toHaveCount(0)
	})

	test('hides them again on clicking away', async ({ page }) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')

		await frontmatter
			.getByRole('button', { name: 'Edit frontmatter source' })
			.click()
		await content.getByText('Body text.').click()

		await expect(frontmatter.locator('.syntax-hidden')).toHaveCount(2)
	})
})
