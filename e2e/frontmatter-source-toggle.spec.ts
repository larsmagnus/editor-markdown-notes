import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Frontmatter source toggle in the live editor', () => {
	test('moving the caret into the block does not reveal the fences or the raw source', async ({
		page,
	}) => {
		await openInVSCode(page, '---\nname: notes\n---\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')
		const rendered = frontmatter.getByTestId('frontmatter-rendered')

		await frontmatter.click()

		await expect(rendered).toBeVisible()
		await expect(rendered).not.toContainText('---')
	})

	test('"Edit source" reveals the raw fence-included text', async ({
		page,
	}) => {
		await openInVSCode(page, '---\nname: notes\n---\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')
		const rendered = frontmatter.getByTestId('frontmatter-rendered')

		await frontmatter
			.getByRole('button', { name: 'Edit frontmatter source' })
			.click()

		await expect(rendered).toHaveCount(0)
	})

	test('leaving raw source mode re-renders the key/value view from the edited text', async ({
		page,
	}) => {
		await openInVSCode(page, '---\nname: notes\n---\n\nBody text.')
		const content = page.getByRole('textbox').first()
		const frontmatter = content.locator('[data-type="frontmatter"]')
		const rendered = frontmatter.getByTestId('frontmatter-rendered')

		await frontmatter
			.getByRole('button', { name: 'Edit frontmatter source' })
			.click()
		await content.getByText('Body text.').click()

		await expect(rendered).toBeVisible()
		await expect(rendered).not.toContainText('---')
	})
})
