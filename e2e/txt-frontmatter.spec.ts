import { expect, test } from '@playwright/test'

import { openInVSCode } from '#e2e/lib/vscode-host'

/**
 * A `.txt` file's schema has no frontmatter node, so a leading `---` block
 * stays a literal horizontal rule rather than being read as metadata and
 * disappearing from the document.
 */
test.describe('A leading --- block in a .txt file', () => {
	test('renders as an ordinary horizontal rule, not frontmatter', async ({
		page,
	}) => {
		await openInVSCode(
			page,
			'---\ntitle: Roadmap\n---\n\nShip it.',
			'notes.txt'
		)
		const content = page.getByRole('textbox').first()

		await expect(content.locator('[data-type="frontmatter"]')).toHaveCount(0)
		await expect(content.locator('[data-type="horizontalRule"]')).toHaveCount(1)
		await expect(content).toContainText('title: Roadmap')
	})

	test('round-trips through the raw view unchanged', async ({ page }) => {
		const note = '---\ntitle: Roadmap\n---\n\nShip it.'
		await openInVSCode(page, note, 'notes.txt')

		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(note)
	})
})
