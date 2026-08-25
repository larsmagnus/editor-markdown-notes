import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Headings in the live editor', () => {
	test('typing "# " creates a real heading and saves it back out unchanged', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('# Roadmap')

		await expect(content.locator('h1')).toBeVisible()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('# Roadmap')
	})

	test('the # marker is hidden while the caret is elsewhere, and reveals when it enters the heading', async ({
		page,
	}) => {
		await openInVSCode(page, '## Roadmap\n\nShip it.')
		const content = page.getByRole('textbox').first()
		const heading = content.locator('h2')
		const marker = heading.locator('.syntax-hidden')
		const body = content.getByText('Ship it.', { exact: false })

		await body.click()
		await expect(marker).toHaveCount(1)

		await heading.click()
		await expect(marker).toHaveCount(0)

		await body.click()
		await expect(marker).toHaveCount(1)
	})

	test('retyping the marker changes the rendered heading level live', async ({
		page,
	}) => {
		await openInVSCode(page, '# Roadmap')
		const content = page.getByRole('textbox').first()

		await expect(content.locator('h1')).toBeVisible()

		await content.locator('h1').click()
		await page.keyboard.press('Home')
		await page.keyboard.type('#')

		await expect(content.locator('h2')).toBeVisible()
		await expect(content.locator('h2')).toHaveText('## Roadmap')
	})
})
