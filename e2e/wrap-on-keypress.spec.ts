import { expect, test } from '#e2e/lib/fixtures'
import { selectSubstring } from '#e2e/lib/select-text'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Wrapping selected text with formatting triggers', () => {
	test('pressing backtick wraps selection in code', async ({ page }) => {
		await openInVSCode(page, 'this json object')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'json')
		await expect(content).toBeFocused()
		await page.keyboard.type('`')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('this `json` object')
	})

	test('pressing tilde wraps selection in strikethrough', async ({ page }) => {
		await openInVSCode(page, 'strike this word')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'this')
		await expect(content).toBeFocused()
		await page.keyboard.type('~')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('strike ~~this~~ word')
	})

	test('pressing asterisk wraps selection in italic', async ({ page }) => {
		await openInVSCode(page, 'make this italic')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'this')
		await expect(content).toBeFocused()
		await page.keyboard.type('*')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('make *this* italic')
	})

	test('pressing underscore wraps selection in italic', async ({ page }) => {
		await openInVSCode(page, 'make this italic')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'this')
		await expect(content).toBeFocused()
		await page.keyboard.type('_')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('make _this_ italic')
	})

	test('re-pressing same trigger unwraps', async ({ page }) => {
		await openInVSCode(page, 'this `code` word')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, '`code`')
		await expect(content).toBeFocused()
		await page.keyboard.type('`')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('this code word')
	})

	test('different trigger nests formatting', async ({ page }) => {
		await openInVSCode(page, 'word **bold** text')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, '**bold**')
		await expect(content).toBeFocused()
		await page.keyboard.type('_')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('word _**bold**_ text')
	})

	test('pressing double quote wraps selection in quotes', async ({ page }) => {
		await openInVSCode(page, 'this is quoted')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'is quoted')
		await expect(content).toBeFocused()
		await page.keyboard.type('"')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('this "is quoted"')
	})

	test('pressing single quote wraps selection in quotes', async ({ page }) => {
		await openInVSCode(page, 'this is quoted')
		const content = page.getByRole('textbox').first()

		await selectSubstring(content, 'is quoted')
		await expect(content).toBeFocused()
		await page.keyboard.type("'")

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue("this 'is quoted'")
	})
})
