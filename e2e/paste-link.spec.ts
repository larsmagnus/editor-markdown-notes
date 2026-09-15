import { pasteText } from '#e2e/lib/clipboard'
import { expect, test } from '#e2e/lib/fixtures'
import { selectSubstring } from '#e2e/lib/select-substring'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Pasting URL over selected text creates a link', () => {
	test('pasting http URL over selection creates link', async ({ page }) => {
		await openInVSCode(page, 'click here for more')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'click here')
		await expect(content).toBeFocused()
		await pasteText(content, 'https://example.com')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('[click here](https://example.com) for more')
	})

	test('pasting https URL over selection creates link', async ({ page }) => {
		await openInVSCode(page, 'visit us')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'visit us')
		await expect(content).toBeFocused()
		await pasteText(content, 'https://example.com/path?query=value')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue(
			'[visit us](https://example.com/path?query=value)'
		)
	})

	test('pasting URL over existing link replaces href', async ({ page }) => {
		await openInVSCode(page, '[old link](https://old.com)')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'old link')
		await expect(content).toBeFocused()
		await pasteText(content, 'https://new.com')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('[old link](https://new.com)')
	})

	test('pasting non-URL text over selection does not create link', async ({
		page,
	}) => {
		await openInVSCode(page, 'click here for more')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'click here')
		await expect(content).toBeFocused()
		await pasteText(content, 'just plain text')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('just plain text for more')
	})

	test('pasting www. URL over selection does not create link', async ({
		page,
	}) => {
		await openInVSCode(page, 'click here for more')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'click here')
		await expect(content).toBeFocused()
		await pasteText(content, 'www.example.com')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('www.example.com for more')
	})
})
