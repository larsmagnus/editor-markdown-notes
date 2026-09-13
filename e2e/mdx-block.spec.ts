import { expect, test } from '#e2e/lib/fixtures'
import { pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

const NOTE = "import Foo from './foo.jsx'\n\n# Roadmap\n\nShip it."

/**
 * An `.mdx` file's JSX/`import`/`export`/`{expression}` constructs render as
 * an opaque, labelled block rather than through the live editor's usual
 * markdown pipeline - real prose elsewhere in the same document still gets
 * the full live editor.
 */
test.describe('An MDX block in the live editor', () => {
	test('renders as a labelled block, distinct from the surrounding prose', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE, 'notes.mdx')
		const content = page.getByRole('textbox').first()

		const block = content.locator('[data-type="mdx-block"]')
		await expect(block).toContainText("import Foo from './foo.jsx'")
		await expect(block).toContainText('MDX')
		await expect(content.getByRole('heading', { level: 1 })).toHaveText(
			'# Roadmap'
		)
	})

	test('round-trips through the raw view unchanged', async ({ page }) => {
		await openInVSCode(page, NOTE, 'notes.mdx')

		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(NOTE)
	})

	test('Backspace at the start of the block does not dissolve it', async ({
		page,
	}) => {
		await openInVSCode(page, NOTE, 'notes.mdx')
		const content = page.getByRole('textbox').first()
		const block = content.locator('[data-type="mdx-block"]')

		await block.click()
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'Backspace')

		await expect(block).toBeVisible()
		await expect(block).toContainText("import Foo from './foo.jsx'")
	})

	// A file saved mid-edit elsewhere (or by a tool that writes incomplete MDX)
	// is a normal thing to open, not a reason to fail to open at all.
	test('opens without crashing when the file has an unclosed JSX tag', async ({
		page,
	}) => {
		await openInVSCode(page, '# Roadmap\n\n<Foo\n\nShip it.', 'notes.mdx')
		const content = page.getByRole('textbox').first()

		await expect(content.getByRole('heading', { level: 1 })).toBeVisible()
		await expect(content.getByText('Ship it.')).toBeVisible()
	})
})
