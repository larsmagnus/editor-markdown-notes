import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('HTML blocks in the live editor', () => {
	test('draws an HTML block as HTML', async ({ page }) => {
		await openInVSCode(
			page,
			'# Plan\n\n<div><kbd>Ctrl</kbd> + <b>S</b></div>\n'
		)

		const rendered = page.getByTestId('html-block-rendered')
		await expect(rendered.locator('kbd')).toHaveText('Ctrl')
		await expect(rendered.locator('b')).toHaveText('S')
	})

	test('strips scripts and event handlers from what it draws', async ({
		page,
	}) => {
		await openInVSCode(
			page,
			'<div>Ship it.<script>window.ran = true</script><img src="x.png" onerror="window.ran = true"></div>\n'
		)

		const rendered = page.getByTestId('html-block-rendered')
		await expect(rendered).toContainText('Ship it.')
		await expect(rendered.locator('script')).toHaveCount(0)
		await expect(rendered.locator('img')).not.toHaveAttribute('onerror')
		expect(await page.evaluate(() => 'ran' in window)).toBe(false)
	})

	test('shows the source to edit once clicked, and saves the edit verbatim', async ({
		page,
	}) => {
		await openInVSCode(page, '<p align="center">Ship it.</p>\n\nDone.\n')

		await page.getByTestId('html-block-rendered').click()
		await page.keyboard.press('End')
		await page.keyboard.type('<!-- reviewed -->')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('<p align="center">Ship it.</p><!-- reviewed -->\n\nDone.\n')
	})

	test('shows half of an element split around markdown as source', async ({
		page,
	}) => {
		await openInVSCode(
			page,
			'<details>\n<summary>Plan</summary>\n\nShip **it**.\n\n</details>\n'
		)
		const content = page.getByRole('textbox').first()

		await expect(page.getByTestId('html-block-rendered')).toHaveCount(0)
		await expect(content).toContainText('<details>')
		await expect(content).toContainText('</details>')
		await expect(content.locator('strong')).toContainText('it')
	})

	test('keeps a comment reachable as source', async ({ page }) => {
		await openInVSCode(page, 'Ship it.\n\n<!-- a note to self -->\n')

		await expect(page.getByRole('textbox').first()).toContainText(
			'<!-- a note to self -->'
		)
	})
})
