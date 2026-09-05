import { expect, test } from '@/e2e/lib/fixtures'
import { openInVSCode } from '@/e2e/lib/helpers'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'

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
		await actionSettled(page, () => content.locator('strong').dblclick())
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'ArrowRight')
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

		await actionSettled(page, () => content.locator('p').click())
		await page.keyboard.type('# Shopping list')
		await pressKeySettled(page, 'Enter')
		await page.keyboard.type('- Milk')
		await pressKeySettled(page, 'Enter')
		// Continuing a list item already seeds its own marker - only the text
		// itself is typed here.
		await page.keyboard.type('**Bread**')
		// Enter seeds a third, empty item (marker only, no text) - Backspace
		// right after that marker (the very position the caret already sits at)
		// lifts it back out, the same case backspace-boundaries.spec.ts exercises
		// per-construct.
		await pressKeySettled(page, 'Enter')

		await expect(
			content.getByRole('heading', { name: 'Shopping list', level: 1 })
		).toBeVisible()
		await expect(content.locator('li', { hasText: 'Milk' })).toBeVisible()
		await expect(
			content.locator('li strong', { hasText: 'Bread' })
		).toBeVisible()
		await expect(content.locator('li')).toHaveCount(3)

		await pressKeySettled(page, 'Backspace')
		await expect(content.locator('li')).toHaveCount(2)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toContainText('- Milk')
		await expect(raw).toContainText('- **Bread**')
	})
})
