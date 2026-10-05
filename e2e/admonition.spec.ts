import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

const NOTE = ['> [!NOTE]', '> Back up the vault first.'].join('\n')

test.describe('Admonitions in the live editor', () => {
	test('a tagged quote draws a header instead of its [!NOTE] text', async ({
		page,
	}) => {
		await openInVSCode(page, `${NOTE}\n\nA plain paragraph.`)
		const content = page.getByRole('textbox').first()
		const quote = content.locator('blockquote[data-admonition="note"]')

		await content.getByText('A plain paragraph.').click()

		await expect(quote.locator('.admonition-header')).toHaveText('Note')
		await expect(quote.locator('.admonition-header')).toBeVisible()
	})

	test('the tag reveals as text when the caret reaches its line and the header steps aside', async ({
		page,
	}) => {
		await openInVSCode(page, `${NOTE}\n\nA plain paragraph.`)
		const content = page.getByRole('textbox').first()
		const quote = content.locator('blockquote[data-admonition="note"]')

		await content.getByText('A plain paragraph.').click()
		await expect(quote.locator('.syntax-hidden')).toHaveCount(2)

		await actionSettled(page, () => quote.locator('.admonition-header').click())

		await expect(quote.locator('.admonition-header')).toBeHidden()
		await expect(quote.locator('.syntax-hidden')).toHaveCount(0)
		await expect(quote.locator('p').first()).toContainText('[!NOTE]')
	})

	test('typing > [!TIP] converts the quote as soon as the tag is complete', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('> [!TIP]')

		await expect(
			content.locator('blockquote[data-admonition="tip"]')
		).toBeVisible()
	})

	test('deleting a character of the tag turns the alert back into a plain quote, keeping the text', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () =>
			content.locator('blockquote p').first().click()
		)
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Backspace')

		await expect(content.locator('blockquote[data-admonition]')).toHaveCount(0)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('> [!NOTE\n>\n> Back up the vault first.')
	})

	test('keeps an alert round-tripping unchanged', async ({ page }) => {
		await openInVSCode(page, NOTE)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(NOTE)
	})
})
