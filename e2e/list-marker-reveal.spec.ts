import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('List markers in the live editor', () => {
	test('the bullet is hidden while the caret is elsewhere, and reveals when it reaches the marker itself', async ({
		page,
	}) => {
		await openInVSCode(page, '- First item\n- Second item')
		const content = page.getByRole('textbox').first()
		const item = content.locator('li', { hasText: 'Second item' })
		const marker = item.locator('.syntax-hidden')
		const other = content.locator('li', { hasText: 'First item' })

		await other.click()
		await expect(marker).toHaveCount(1)

		// Clicking the item's own text (not its marker) must not reveal it -
		// only the marker's own range does.
		await item.click()
		await expect(marker).toHaveCount(1)

		// The marker's own left edge, where "- " renders as zero-width.
		await item.click({ position: { x: 2, y: 2 } })
		await expect(marker).toHaveCount(0)

		await other.click()
		await expect(marker).toHaveCount(1)
	})

	test('renumbers an ordered list live when an earlier item is removed', async ({
		page,
	}) => {
		await openInVSCode(page, '1. First\n2. Second')
		const content = page.getByRole('textbox').first()

		// Delete the whole first item (name and marker both), leaving "Second"
		// promoted to the list's own first position.
		await content.locator('li', { hasText: 'First' }).click()
		await page.keyboard.press('Home')
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Home')
		await page.keyboard.up('Shift')
		await page.keyboard.press('Backspace')

		// Its own displayed number corrects to match its new position -
		// `list-marker-sync-plugin.ts` renumbers on any structural change, not
		// just a freshly typed marker.
		await expect(content.locator('li', { hasText: 'Second' })).toHaveText(
			'1. Second'
		)
	})
})
