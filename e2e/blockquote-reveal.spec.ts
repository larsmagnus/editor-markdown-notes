import { expect, test } from '@/e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

test.describe('Blockquotes in the live editor', () => {
	test('typing "> " creates a real blockquote and saves it back out unchanged', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('> Ship it')

		await expect(content.locator('blockquote')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('> Ship it')
	})

	test('the > marker is hidden while the caret is elsewhere, and reveals when it reaches the marker itself', async ({
		page,
	}) => {
		await openInVSCode(page, '> Ship it\n\nA plain paragraph.')
		const content = page.getByRole('textbox').first()
		const quote = content.locator('blockquote')
		const marker = quote.locator('.syntax-hidden')
		const body = content.getByText('A plain paragraph.', { exact: false })

		await body.click()
		await expect(marker).toHaveCount(1)

		// Clicking the quote's own text (not its marker) must not reveal it - the
		// same over-eager-reveal bug lists-marker-reveal.spec.ts guards against.
		await actionSettled(page, () =>
			quote.getByText('Ship', { exact: false }).click()
		)
		await expect(marker).toHaveCount(1)

		// Home lands the caret at the marker's own (zero-width) start, which
		// does reveal it.
		await pressKeySettled(page, 'Home')
		await expect(marker).toHaveCount(0)

		await body.click()
		await expect(marker).toHaveCount(1)
	})

	test('backspace right after the marker removes it and exits the quote, not duplicates it', async ({
		page,
	}) => {
		await openInVSCode(page, '> Ship it')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('blockquote p').click())
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'Backspace')

		await expect(content.locator('blockquote')).toHaveCount(0)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Ship it')
	})

	test('deleting the quote content down to empty character by character does not duplicate the marker', async ({
		page,
	}) => {
		await openInVSCode(page, '> Hi')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('blockquote p').click())
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'Backspace')
		await pressKeySettled(page, 'Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('> ')
	})

	test('keeps a nested blockquote round-tripping unchanged', async ({
		page,
	}) => {
		const markdown = ['> Blockquote', '>', '> > Nested blockquote'].join('\n')
		await openInVSCode(page, markdown)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(markdown)
	})
})
