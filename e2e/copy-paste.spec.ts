import { copySelectionHtml, pasteHtml } from '#e2e/lib/clipboard'
import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

/**
 * Every block construct's marker is real text, so the editor's own clipboard
 * HTML already carries it. Reinstating one on the way back in - which is the
 * right thing for HTML from anywhere else - doubles it.
 */
test.describe('Copying and pasting within the editor', () => {
	test('pasting a copied heading does not double its marker', async ({
		page,
	}) => {
		await openInVSCode(page, '## Heading\n\nBody.')
		const content = page.getByRole('textbox').first()

		// Triple-click, so the slice carries the `<h2>` itself - a selection
		// within the line copies inline content, which has no marker to double.
		await actionSettled(page, () =>
			content.getByText('Heading').click({ clickCount: 3 })
		)
		await expect(content).toBeFocused()
		const html = await copySelectionHtml(content)

		await actionSettled(page, () => content.getByText('Body.').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Enter')
		await pasteHtml(content, html, '## Heading')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).not.toHaveValue(/## ##/)
	})

	test('pasting a copied list item does not double its bullet', async ({
		page,
	}) => {
		await openInVSCode(page, '- Buy milk\n\nBody.')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Buy milk').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'Shift+End')
		const html = await copySelectionHtml(content)

		await actionSettled(page, () => content.getByText('Body.').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Enter')
		await pasteHtml(content, html, '- Buy milk')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/- \\-/)
		await expect(raw).not.toHaveValue(/- - /)
	})

	test('pasting a copied blockquote does not double its marker', async ({
		page,
	}) => {
		await openInVSCode(page, '> Quoted\n\nBody.')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Quoted').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'Shift+End')
		const html = await copySelectionHtml(content)

		await actionSettled(page, () => content.getByText('Body.').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Enter')
		await pasteHtml(content, html, '> Quoted')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		// Pasting a quote beside one merges the two, so a nested `> > ` here is
		// correct. What must not appear is an escaped `&gt;` - that is the marker
		// having been reinstated on top of itself and left as literal prose.
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).not.toHaveValue(/&gt;/)
	})
})
