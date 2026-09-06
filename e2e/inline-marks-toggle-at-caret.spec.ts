import { expect, test } from '@/e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

/**
 * Pressing a style shortcut with no selection, then typing, is one of the most
 * common ways to write styled text. The delimiters are real text, so this has
 * to put both of them down and leave the caret between - a stored mark alone
 * styles only the first character, because the closing delimiter is what ends
 * the run and the mark is deliberately not inclusive.
 */
test.describe('Toggling a style at a bare caret', () => {
	test('styles everything typed after it, not just the first character', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		// Typed, not part of the fixture: markdown-it strips a paragraph's
		// trailing space, so the caret would otherwise sit flush against `Ship`.
		await page.keyboard.type(' ')
		await page.keyboard.press('ControlOrMeta+b')
		await page.keyboard.type('the notes')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship **the notes**')
	})

	// `_`, not `*`: the italic marker is a setting, and `_` is its default.
	test('does the same for italic', async ({ page }) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.type(' ')
		await page.keyboard.press('ControlOrMeta+i')
		await page.keyboard.type('the notes')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship _the notes_')
	})

	// Inline code's fence length varies with the code's own backticks, so its
	// empty pair is the one shape where the two delimiters are the whole run and
	// nothing separates them - read as undelimited, the run gets a second pair
	// written around it and the author types into `` ` `` ` `` instead.
	test('does the same for inline code', async ({ page }) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.type(' ')
		await page.keyboard.press('ControlOrMeta+e')
		await page.keyboard.type('the notes')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship `the notes`')
	})

	// An empty pair is not valid markdown - `Ship****` parses back to plain
	// text - so one left behind is literal rubbish in the file. Putting the
	// delimiters down before there is anything between them is the whole
	// mechanism, so they have to be taken away again if nothing arrives.
	test('takes the pair back out when the caret leaves without typing', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship\n\nBelow.')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.press('ControlOrMeta+b')
		await content.getByText('Below.').click()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship\n\nBelow.')
	})

	// `_` is the only marker CommonMark refuses to read inside a word, so the
	// one flush against a word has to fall back to `*`. The others (`**`, `~~`,
	// a backtick, a link) parse intraword and are left as they are.
	test('falls back to * for italic written flush against a word', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.press('ControlOrMeta+i')
		await page.keyboard.type('ping')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship*ping*')
	})

	test('leaves bold flush against a word as **, which parses intraword', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.press('ControlOrMeta+b')
		await page.keyboard.type('ping')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship**ping**')
	})

	test('pressing it again at the caret removes the empty pair', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.getByText('Ship').click())
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'End')
		await page.keyboard.type(' ')
		await page.keyboard.press('ControlOrMeta+b')
		await page.keyboard.press('ControlOrMeta+b')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship ')
	})
})
