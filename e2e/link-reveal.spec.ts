import { expect, test } from '@/e2e/lib/fixtures'
import { openInVSCode } from '@/e2e/lib/helpers'
import { actionSettled } from '@/e2e/lib/press-key-settled'
import { selectSubstring } from '@/e2e/lib/select-text'

test.describe('Links in the live editor', () => {
	test('a parsed link saves back out unchanged', async ({ page }) => {
		await openInVSCode(page, 'Read [the notes](https://example.com) first.')
		const content = page.getByRole('textbox').first()

		await expect(content.locator('a')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read [the notes](https://example.com) first.')
	})

	test('the [ ]( ) delimiters are hidden while the caret is elsewhere, and reveal when it enters the link', async ({
		page,
	}) => {
		await openInVSCode(page, 'Read [the notes](https://example.com) first.')
		const content = page.getByRole('textbox').first()
		const link = content.locator('a')
		const delimiters = link.locator('.syntax-hidden')
		const before = content.getByText('Read', { exact: false }).first()

		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)

		await link.click()
		await expect(delimiters).toHaveCount(0)

		await before.click({ position: { x: 2, y: 2 } })
		await expect(delimiters).toHaveCount(2)
	})

	test('editing the revealed URL text directly changes what gets saved', async ({
		page,
	}) => {
		await openInVSCode(page, 'Read [the notes](https://old.example.com) first.')
		const content = page.getByRole('textbox').first()
		const link = content.locator('a')

		// A click that hasn't settled yet races the keys that follow (see
		// `keyboard-navigation.spec.ts`'s Escape/Tab race for the same issue).
		await actionSettled(page, () => link.click())
		await expect(content).toBeFocused()
		await expect(link.locator('.syntax-hidden')).toHaveCount(0)

		// Selects `old` via the Selection API rather than walking there with arrow
		// presses - the point is what typing over a selection does, not how a
		// user's arrows would build one. `insertText`, not `type`/
		// `pressSequentially`: those dispatch one synthetic keydown per character,
		// and replacing a selection that way intermittently drops characters, a
		// CDP artifact not seen with real input or `insertText`'s atomic event.
		await actionSettled(page, () => selectSubstring(link, 'old'))
		await page.keyboard.insertText('new')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read [the notes](https://new.example.com) first.')
	})
})
