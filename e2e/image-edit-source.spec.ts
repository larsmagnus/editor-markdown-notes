import type { Page } from '@playwright/test'

import { expect, test } from '@/e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

/**
 * "Edit image source" reveals text and moves the selection onto it via a
 * ProseMirror transaction dispatched from a React click handler, not a real
 * keystroke - `actionSettled` is what confirms that selection change has
 * actually reached the DOM before a test acts on the revealed text.
 */
function editSource(page: Page) {
	return actionSettled(page, () =>
		page.getByRole('button', { name: 'Edit image source' }).click()
	)
}

/**
 * The toolbar's own overlay div carries the `opacity-0`/`group-hover:opacity-100`
 * classes (`overlay-toolbar.tsx`) - not the button inside it, whose own
 * computed opacity is always `1` regardless of the parent's, since `opacity`
 * doesn't cascade into a child's own computed value the way `color` does.
 */
function toolbarOpacity(page: Page) {
	return page
		.getByRole('button', { name: 'Edit image source' })
		.locator('xpath=..')
}

test.describe('Image editing in the live editor', () => {
	test('"Edit source" reveals the markdown with the path selected, caret at its end', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const source = content.locator('[data-type="image-source"]')

		await editSource(page)

		await expect(source).toHaveText('![Diagram](./diagram.png)')
		const selected = await page.evaluate(() =>
			window.getSelection()?.toString()
		)
		expect(selected).toBe('./diagram.png')
	})

	test('typing into the revealed text updates the rendered image live', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await editSource(page)
		// The path is already selected, so typing replaces it.
		await page.keyboard.type('./renamed.png')

		const updated = content.getByRole('img', { name: 'Diagram' })
		await expect(updated).toHaveAttribute('src', './renamed.png')
	})

	test('arrowing left out of the revealed text hides it and keeps navigating', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some text.\n\n![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const source = content.locator('[data-type="image-source"]')

		await editSource(page)
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'ArrowLeft')

		await expect(source).toHaveCount(0)
		await expect(content.getByRole('img', { name: 'Diagram' })).toBeVisible()
	})

	test('arrowing right off the end of the revealed text hides it without getting stuck', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const toolbar = toolbarOpacity(page)

		await editSource(page)
		await pressKeySettled(page, 'End')
		await pressKeySettled(page, 'ArrowRight')

		await expect(content.locator('[data-type="image-source"]')).toHaveCount(0)
		// The caret is now soft-focused on the image rather than past it (there's
		// nothing after it), which the still-visible toolbar shows.
		await expect(toolbar).toHaveCSS('opacity', '1')
	})

	// Clearing the source and leaving is how an image is deleted through
	// editing, the revealed text being the only editable form the image has.
	test('clearing the revealed text and exiting deletes the image', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some text.\n\n![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await editSource(page)
		// The path is already selected on entry - collapse that selection first,
		// or `Home` only collapses it to its own start rather than reaching the
		// true start of the revealed text.
		await pressKeySettled(page, 'ArrowLeft')
		await pressKeySettled(page, 'Home')
		await pressKeySettled(page, 'Shift+End')
		await pressKeySettled(page, 'Delete')
		await pressKeySettled(page, 'Enter')

		await expect(content.getByRole('img')).toHaveCount(0)
	})

	// A half-typed source is not a request to delete anything - only the last
	// text that did parse ever reaches the image's attrs.
	test('leaving unparseable text keeps the image at its last valid source', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await editSource(page)
		// `End` moves the caret past the image itself (see
		// `image-arrow-entry.spec.ts`), which exits editing outright - two
		// `ArrowRight`s instead collapse the initial path selection and step
		// past the closing paren while staying inside the revealed text.
		await pressKeySettled(page, 'ArrowRight')
		await pressKeySettled(page, 'ArrowRight')
		await page.keyboard.type('x')

		await expect(content.getByRole('img', { name: 'Diagram' })).toHaveAttribute(
			'src',
			'./diagram.png'
		)
	})

	test('deletes the image via its toolbar', async ({ page }) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await page.getByRole('button', { name: 'Delete image' }).click()

		await expect(content.getByRole('img')).toHaveCount(0)
	})
})
