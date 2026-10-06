import { expect, test } from '@playwright/test'

import { openInVSCode } from '#e2e/lib/vscode-host'

const LONG_LINE = 'word '.repeat(80).trim()
const CONTENT = ['# Title', '', LONG_LINE, '', 'Last line'].join('\n')

test.describe('Raw line numbers', () => {
	test('a wrapped line gets one number, beside its first visual row', async ({
		page,
	}) => {
		await openInVSCode(page, CONTENT)
		await page.getByRole('button', { name: 'Raw editor' }).click()

		const gutter = page.getByTestId('raw-line-gutter')
		const rows = gutter.locator('[data-line]')
		await expect(rows).toHaveCount(5)

		const lineHeight = await rows
			.first()
			.evaluate((row) => parseFloat(getComputedStyle(row).lineHeight))
		const wrapped = await rows.nth(2).boundingBox()
		const next = await rows.nth(3).boundingBox()

		expect(wrapped?.height).toBeGreaterThan(lineHeight * 1.5)
		expect(next?.y).toBeCloseTo((wrapped?.y ?? 0) + (wrapped?.height ?? 0), 0)
	})

	test('every number is fully on screen', async ({ page }) => {
		await openInVSCode(page, CONTENT)
		await page.getByRole('button', { name: 'Raw editor' }).click()

		const numberLeft = await page
			.getByTestId('raw-line-gutter')
			.locator('[data-line]')
			.first()
			.evaluate((row) => {
				const text = row.getBoundingClientRect().left
				const width = parseFloat(getComputedStyle(row, '::before').width)
				return text - width
			})

		expect(numberLeft).toBeGreaterThanOrEqual(0)
	})

	test('the gutter does not clip the numbers it hangs outside its own box', async ({
		page,
	}) => {
		await openInVSCode(page, CONTENT)
		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(page.getByTestId('raw-line-gutter')).toHaveCSS(
			'overflow',
			'visible'
		)
	})
})
