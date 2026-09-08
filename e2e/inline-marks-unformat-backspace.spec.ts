import { backspaceAtEndOf } from '#e2e/lib/backspace-positions'
import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

/**
 * Backspacing at a delimiter is how a writer unformats text without reaching
 * for the toolbar, and single-character deletion is the browser's own - no
 * keymap handler sees it - so this only means anything in a real one.
 *
 * Each fixture ends at the delimiter, so `End` reaches it without counting
 * arrow presses.
 */
test.describe('Backspacing a closing delimiter', () => {
	const cases = [
		{ style: 'bold', markdown: 'Ship **the notes**' },
		{ style: 'italic', markdown: 'Ship _the notes_' },
		{ style: 'strikethrough', markdown: 'Ship ~~the notes~~' },
		{ style: 'inline code', markdown: 'Ship `the notes`' },
	]

	for (const { style, markdown } of cases) {
		test(`unformats ${style} text`, async ({ page }) => {
			await openInVSCode(page, markdown)
			await backspaceAtEndOf(page, 'the notes')

			await page.getByRole('button', { name: 'Raw editor' }).click()
			await expect(
				page.getByRole('textbox', { name: 'Raw markdown' })
			).toHaveValue('Ship the notes')
		})
	}

	test('removes a link outright rather than duplicating its bracket', async ({
		page,
	}) => {
		await openInVSCode(page, 'Read [the guide](https://example.com)')
		await backspaceAtEndOf(page, 'the guide')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read the guide')
	})
})
