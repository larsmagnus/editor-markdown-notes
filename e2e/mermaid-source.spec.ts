import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

const NOTE = ['```mermaid', 'graph TD', '  A-->B', '```'].join('\n')

/**
 * A mermaid block's source is a code block that happens to have a diagram drawn
 * in front of it, so editing it behaves like editing any other code block.
 */
test.describe('A mermaid block showing its source', () => {
	// Editing the fence tag is what turns the diagram off, so the tag is the one
	// place where every keystroke changes what the block renders. The caret has
	// to survive that: swapping the rendered output must not move it, or the
	// character that ends the word `mermaid` cannot be typed back.
	test('keeps the caret where it is when the fence tag stops saying mermaid', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () =>
			page.getByRole('button', { name: 'Edit diagram source' }).click()
		)
		await expect(content).toBeFocused()
		// The toolbar going away is the signal that the block has re-rendered
		// around the source; keys pressed before that hit a collapsed block with
		// no geometry to move a caret over.
		await expect(
			page.getByRole('button', { name: 'Edit diagram source' })
		).toBeHidden()
		const code = content.locator('code').first()
		await expect(code).toBeVisible()
		await expect(code.locator('.syntax-hidden')).toHaveCount(0)
		// Arrowed rather than `End`: the caret starts at the block's first
		// character, and this counts exactly to the end of "```mermaid".
		for (let step = 0; step < '```mermaid'.length; step++) {
			await pressKeySettled(page, 'ArrowRight')
		}
		await pressKeySettled(page, 'Backspace')
		await page.keyboard.type('d')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		// The trailing newline is the serializer's: a document ending in a code
		// block gets one the moment it is written back out.
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(`${NOTE}\n`)
	})

	test('offers the same copy button every other code block has', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE)
		const copy = page.getByRole('button', { name: 'Copy code' })

		// The diagram has its own toolbar, and the source is collapsed behind it.
		await expect(copy).toBeHidden()

		await page.getByRole('button', { name: 'Edit diagram source' }).click()

		await expect(copy).toBeVisible()
	})
})
