import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Image toolbar: link and copy', () => {
	test('wraps an image in a link and saves the markdown', async ({ page }) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')

		await page.getByTitle('Link').click()
		await page.getByLabel('URL').fill('https://example.com')
		await page.getByRole('button', { name: 'Apply' }).click()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('[![Diagram](./diagram.png)](https://example.com)')
	})

	test('unlinks an already-linked image via its toolbar', async ({ page }) => {
		await openInVSCode(page, '[![Diagram](./diagram.png)](https://example.com)')

		await page.getByRole('button', { name: 'Unlink image' }).click()

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('![Diagram](./diagram.png)')
	})

	// A linked image's toolbar renders inside the real `<a>` its mark produces
	// (see `overlay-toolbar.tsx`), which would otherwise navigate on any click.
	test("clicking a linked image's toolbar never opens its link in a new tab", async ({
		page,
		context,
	}) => {
		await openInVSCode(page, '[![Diagram](./diagram.png)](https://example.com)')

		const openedPage = new Promise((resolve) => context.once('page', resolve))
		await page.getByRole('button', { name: 'Unlink image' }).click()

		const raced = await Promise.race([
			openedPage.then(() => 'opened'),
			page.waitForTimeout(500).then(() => 'timed-out'),
		])
		expect(raced).toBe('timed-out')
	})

	test('shows the "Unlink image" button immediately for an already-linked image', async ({
		page,
	}) => {
		await openInVSCode(page, '[![Diagram](./diagram.png)](https://example.com)')

		// No interaction yet - this must not depend on a transaction having
		// fired first, since the image already carries the link mark on load.
		await expect(
			page.getByRole('button', { name: 'Unlink image' })
		).toBeVisible()
	})

	test('copying an image shows the toolbar\'s "Copied" feedback', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')

		await page.getByRole('button', { name: 'Copy image markdown' }).click()

		// `role="status"` takes its accessible name only from `aria-label`, never
		// its own text content, so the badge is found by role and asserted on by
		// text rather than by an accessible name it can never have.
		await expect(page.getByRole('status')).toHaveText('Copied')
	})
})
