import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * One named test per construct's marker/delimiter, exercising Backspace at
 * the exact boundary where the marker/delimiter's own text begins or ends -
 * the spot where a naive "marker missing -> insert a fresh one" repair (list
 * markers, delimited marks) reads a partially-deleted remnant as absent and
 * duplicates it instead of replacing it in place.
 */
test.describe('Backspace at construct boundaries in the live editor', () => {
	async function backspaceRightAfterMarker(
		page: import('@playwright/test').Page,
		markerLength: number
	) {
		await page.keyboard.press('Home')
		for (let i = 0; i < markerLength; i++) {
			await page.keyboard.press('ArrowRight')
			// A real user's keystrokes are never this rapid - ProseMirror's
			// DOMObserver batches native-arrow-driven selection changes, and a
			// synthetic press-immediately-after-press sequence can outrun it,
			// leaving `editor.state.selection` briefly stale relative to the DOM.
			// Generous under parallel-worker CPU contention, not just locally.
			await page.waitForTimeout(100)
		}
		await page.keyboard.press('Backspace')
	}

	test('bullet list: backspace right after the marker removes it and exits the list, not duplicates it', async ({
		page,
	}) => {
		await openInVSCode(page, '- Buy milk')
		const content = page.getByRole('textbox').first()

		await content.locator('li').click()
		await backspaceRightAfterMarker(page, 2) // "- "

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Buy milk')
	})

	test('ordered list: backspace right after the marker removes it and exits the list, not duplicates it', async ({
		page,
	}) => {
		await openInVSCode(page, '1. Buy milk')
		const content = page.getByRole('textbox').first()

		await content.locator('li').click()
		await backspaceRightAfterMarker(page, 3) // "1. "

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Buy milk')
	})

	test('task list: backspace right after the marker removes it and exits the list, not duplicates it', async ({
		page,
	}) => {
		await openInVSCode(page, '- [ ] Buy milk')
		const content = page.getByRole('textbox').first()

		await content.locator('li').click()
		await backspaceRightAfterMarker(page, 6) // "- [ ] "

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Buy milk')
	})

	test('checked task list: backspace right after the marker removes it and exits the list, not duplicates it', async ({
		page,
	}) => {
		await openInVSCode(page, '- [x] Buy milk')
		const content = page.getByRole('textbox').first()

		await content.locator('li').click()
		await backspaceRightAfterMarker(page, 6) // "- [x] "

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Buy milk')
	})

	test('bold: backspace between the two opening asterisks does not triple the delimiter', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some **bold** text')
		const content = page.getByRole('textbox').first()

		// Reveals the delimiters (real text) so ArrowLeft can land between them.
		// Delays between presses avoid the same ProseMirror-state-staleness
		// window `backspaceRightAfterMarker` above works around.
		await content.locator('strong').dblclick()
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowLeft') // caret before "bold", after "**"
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowLeft') // caret between the two "*"
		await page.waitForTimeout(100)
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/\*\*\*/)
	})

	test('strikethrough: backspace between the two opening tildes does not triple the delimiter', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some ~~struck~~ text')
		const content = page.getByRole('textbox').first()

		await content.locator('s').dblclick()
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowLeft')
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowLeft')
		await page.waitForTimeout(100)
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/~~~/)
	})

	test('inline code: backspace right after the opening backtick does not double the delimiter', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some `code` text')
		const content = page.getByRole('textbox').first()

		await content.locator('code').dblclick()
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowLeft') // caret right after the opening `
		await page.waitForTimeout(100)
		await page.keyboard.press('Backspace')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).not.toHaveValue(/``/)
	})

	test('image: backspace right after clicking it edits the revealed field, not the image node', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		await image.click()
		await page.keyboard.press('Backspace')

		await expect(image).toBeVisible()
	})
})
