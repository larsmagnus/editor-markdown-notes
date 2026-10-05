import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

const NOTE = ['```mermaid', 'graph TD', '  A-->B', '```'].join('\n')

/**
 * The rendered diagram is a node view inside the document, so the editor must
 * leave its own controls and its pan gesture to the diagram: taking either for
 * a click in the text would put the caret in the block and swap the diagram for
 * its source.
 */
test.describe('A rendered mermaid diagram', () => {
	test('stays rendered when one of its toolbar buttons is used', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)

		await page.getByRole('button', { name: 'Zoom in' }).click()

		await expect(
			page.getByRole('button', { name: 'Edit diagram source' })
		).toBeVisible()
	})

	test('stays rendered when dragged to pan it', async ({ page }) => {
		await openInVSCode(page, NOTE)
		await page.getByRole('button', { name: 'Zoom in' }).click()
		const diagram = page.getByRole('img', { name: 'Mermaid diagram' })
		const box = (await diagram.boundingBox())!

		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {
			steps: 8,
		})
		await page.mouse.up()

		await expect(
			page.getByRole('button', { name: 'Edit diagram source' })
		).toBeVisible()
	})
})
