import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

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
			const content = page.getByRole('textbox').first()

			await content.getByText('the notes').click()
			await expect(content).toBeFocused()
			await page.keyboard.press('End')
			await page.waitForTimeout(100)
			await page.keyboard.press('Backspace')

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
		const content = page.getByRole('textbox').first()

		await content.getByText('the guide').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('End')
		await page.waitForTimeout(100)
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Read the guide')
	})
})

/**
 * A heading's marker steps down a level at a time and only takes the heading
 * apart once there is none left, which is what makes a heading reachable back
 * to a paragraph by editing alone.
 */
test.describe('Backspacing a heading marker', () => {
	test('drops one level at a time', async ({ page }) => {
		await openInVSCode(page, '### Notes')
		const content = page.getByRole('textbox').first()

		await content.getByText('Notes').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		for (let index = 0; index < 4; index += 1) {
			await page.keyboard.press('ArrowRight')
			await page.waitForTimeout(100)
		}
		await page.keyboard.press('Backspace')

		await expect(content.locator('h2')).toHaveText('## Notes')
	})

	test('turns the heading into a paragraph once no level is left', async ({
		page,
	}) => {
		await openInVSCode(page, '# Notes')
		const content = page.getByRole('textbox').first()

		await content.getByText('Notes').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		for (let index = 0; index < 2; index += 1) {
			await page.keyboard.press('ArrowRight')
			await page.waitForTimeout(100)
		}
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Notes')
	})
})
