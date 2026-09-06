import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/vscode-host'

/**
 * Writing a second styled run on a line that already has one. The delimiter
 * that opens it is preceded by the first run's closing delimiter, and an input
 * rule looking only at the text sees a pair spanning the gap between them -
 * `` ` and ` `` - so it styles the words between the two runs and takes the
 * first run's closing delimiter for its own.
 *
 * A delimiter with no partner stays literal text until one arrives. That is
 * both what CommonMark does and the only behaviour that lets a second run be
 * typed at all, since every one of them is a lone delimiter for as long as it
 * takes to type its content.
 */
test.describe('Typing a second inline run on a line that has one', () => {
	test('leaves a lone backtick literal rather than styling the gap', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('`inline code` and `')

		await expect(content.locator('code')).toHaveCount(1)
		await expect(content.locator('code')).toHaveText('`inline code`')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('`inline code` and `')
	})

	test('closes the second backtick pair into its own run', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('`inline code` and `another`')

		await expect(content.locator('code')).toHaveCount(2)
		await expect(content.locator('code').first()).toHaveText('`inline code`')
		await expect(content.locator('code').last()).toHaveText('`another`')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('`inline code` and `another`')
	})

	test('does the same for a second bold run', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('**bold** and **more**')

		await expect(content.locator('strong')).toHaveCount(2)
		await expect(content.locator('strong').first()).toHaveText('**bold**')
		await expect(content.locator('strong').last()).toHaveText('**more**')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('**bold** and **more**')
	})
})
