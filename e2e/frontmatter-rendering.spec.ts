import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/vscode-host'

const NOTE = '---\ntitle: Notes\ndraft: false\n---\n\nBody text.'

test.describe('Frontmatter rendering in the live editor', () => {
	test('keeps each YAML field on its own line', async ({ page }) => {
		await openInVSCode(page, NOTE)
		const frontmatter = page
			.getByRole('textbox')
			.first()
			.locator('[data-type="frontmatter"]')
		await frontmatter.waitFor()

		// The rendered box, not the model: `white-space` has to survive whatever
		// the editor's own stylesheet says about non-editable content, or three
		// fields collapse onto one wrapped line.
		const visible = frontmatter.locator('pre').first()
		await expect(visible).toHaveCSS('white-space', /pre/)
	})

	test('syntax-highlights the YAML', async ({ page }) => {
		await openInVSCode(page, NOTE)
		const frontmatter = page
			.getByRole('textbox')
			.first()
			.locator('[data-type="frontmatter"]')
		await frontmatter.waitFor()

		// Shiki publishes each token as an inline colour; a plain React mirror of
		// the text carries none, which is what "no highlighting" looked like.
		await expect(frontmatter.locator('[style*="color"]').first()).toBeVisible()
	})

	test('renders the block through the editor, not a read-only copy', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)
		const frontmatter = page
			.getByRole('textbox')
			.first()
			.locator('[data-type="frontmatter"]')
		await frontmatter.waitFor()

		// One `pre`, and it is the editable one. A second, `contenteditable=false`
		// mirror is what cost this block both its highlighting and its newlines.
		await expect(frontmatter.locator('pre')).toHaveCount(1)
		await expect(
			frontmatter.locator('pre[contenteditable="false"]')
		).toHaveCount(0)
	})
})
