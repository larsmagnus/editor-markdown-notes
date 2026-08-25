import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * Realistic multi-step editing sessions spanning several constructs in
 * sequence - the "does the whole session hold together" net that isolated
 * per-construct specs can't catch. `backspace-boundaries.spec.ts` covers
 * exhaustive per-construct boundary cases; this file covers workflows.
 */
test.describe('Live editing workflows', () => {
	test('typing immediately after a bold run does not continue bolding new text', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some **bold** text')
		const content = page.getByRole('textbox').first()

		// Select "bold", collapse to its right edge, then step past the two
		// revealed closing-delimiter characters to land right after the run.
		await content.locator('strong').dblclick()
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		await page.keyboard.type('!')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Some **bold**! text')
	})

	test('writing, formatting, editing, and deleting a note holds together', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('# Shopping list')
		await page.keyboard.press('Enter')
		await page.keyboard.type('- Milk')
		await page.keyboard.press('Enter')
		// Continuing a list item already seeds its own marker - only the text
		// itself is typed here.
		await page.keyboard.type('**Bread**')
		await page.keyboard.press('Enter')
		await page.keyboard.type('Eggs')

		await expect(
			content.getByRole('heading', { name: 'Shopping list', level: 1 })
		).toBeVisible()
		await expect(content.locator('li', { hasText: 'Milk' })).toBeVisible()
		await expect(
			content.locator('li strong', { hasText: 'Bread' })
		).toBeVisible()
		await expect(content.locator('li', { hasText: 'Eggs' })).toBeVisible()

		// Delete the "Eggs" item entirely: clear its text, then one more
		// Backspace at the marker boundary lifts the now-empty item out of the
		// list. (Not Home+Shift to select the text - Home's line-start behavior
		// is unreliable across a multi-item list in this environment.)
		await content.locator('li', { hasText: 'Eggs' }).click()
		await page.keyboard.press('End')
		for (let i = 0; i < 'Eggs'.length; i++) {
			await page.keyboard.press('Backspace')
		}
		await page.keyboard.press('Backspace')
		await expect(content.locator('li', { hasText: 'Eggs' })).toHaveCount(0)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('# Shopping list\n\n- Milk\n- **Bread**')
	})
})
