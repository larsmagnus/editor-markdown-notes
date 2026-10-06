import { expect, test } from '@playwright/test'

import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Live slash menu', () => {
	test('clicking a command inserts it', async ({ page }) => {
		await openInVSCode(page, 'Intro\n\n')
		await page.locator('.ProseMirror').click()
		await page.keyboard.press('Control+End')
		await page.keyboard.press('Enter')
		await page.keyboard.type('/')

		await page.getByRole('option', { name: 'Table' }).click()

		await expect(page.locator('.ProseMirror table')).toHaveCount(1)
	})
})
