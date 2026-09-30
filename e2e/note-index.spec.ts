import { expect, test } from '#e2e/lib/fixtures'

test.describe('Index of notes', () => {
	test('filters by keyboard and opens the chosen note with Enter', async ({
		page,
	}) => {
		await page.goto('/')
		await page.getByRole('button', { name: 'Open index' }).click()

		await page.keyboard.type('second fixture')
		await page.keyboard.press('ArrowDown')

		const card = page.getByRole('button', { name: 'Second Fixture Note' })
		await expect(card).toBeFocused()

		await page.keyboard.press('Enter')

		await expect(page.getByRole('dialog', { name: 'Index' })).toBeHidden()
		await expect(
			page.getByRole('textbox').first().getByText('other-note.md')
		).toBeVisible()
	})

	test('moves between cards with the arrow keys, row by row', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 900 })
		await page.goto('/')
		await page.getByRole('button', { name: 'Open index' }).click()

		const cards = page.getByRole('list', { name: 'Notes' }).getByRole('button')
		await expect(cards.first()).toBeVisible()
		const columns = await page
			.getByRole('list', { name: 'Notes' })
			.evaluate(
				(grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length
			)
		expect(columns).toBeGreaterThan(1)

		await page.keyboard.press('ArrowDown')
		await expect(cards.nth(0)).toBeFocused()

		await page.keyboard.press('ArrowRight')
		await expect(cards.nth(1)).toBeFocused()

		await page.keyboard.press('ArrowDown')
		await expect(cards.nth(1 + columns)).toBeFocused()

		await page.keyboard.press('ArrowLeft')
		await expect(cards.nth(columns)).toBeFocused()

		await page.keyboard.press('ArrowUp')
		await expect(cards.nth(0)).toBeFocused()
	})

	test('closes with Escape and returns focus to the toolbar button', async ({
		page,
	}) => {
		await page.goto('/')
		const openIndex = page.getByRole('button', { name: 'Open index' })
		await openIndex.click()

		await page.keyboard.press('Escape')

		await expect(page.getByRole('dialog', { name: 'Index' })).toBeHidden()
		await expect(openIndex).toBeFocused()
	})
})
