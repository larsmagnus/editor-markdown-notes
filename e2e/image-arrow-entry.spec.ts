import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

function caretPosition(field: Locator) {
	return field.evaluate((el: HTMLInputElement) => [
		el.selectionStart,
		el.selectionEnd,
	])
}

/**
 * Walks the caret with `key` until the source field opens, rather than pressing
 * a fixed number of times from a clicked position - where exactly a click lands
 * inside a paragraph is not stable enough to count keypresses off.
 */
async function arrowUntilFieldOpens(page: Page, key: string): Promise<Locator> {
	const field = page.getByLabel('Image source')

	for (let press = 0; press < 20; press++) {
		if ((await field.count()) > 0) return field
		await page.keyboard.press(key)
		// Let React commit the field before deciding whether to press again. A
		// press that lands while the image is already selected is handled as
		// "move into the toolbar" instead, which steals the focus this asserts on.
		await page.waitForTimeout(50)
	}

	await expect(field).toHaveCount(1)
	return field
}

/**
 * Arrowing onto an image selects the node itself and opens its source field at
 * the edge the caret arrived from. Both halves matter: without a real
 * `NodeSelection` the editor keeps its own text caret beside the image and two
 * carets show at once, and without the key being consumed the same press
 * carries on into the field and lands the caret one character off.
 */
test.describe('Arrow-key entry onto an image in the live editor', () => {
	test('arrowing on from the text before it opens the field with the caret at its start', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		// Under a full-suite run the click can land before the editor has taken
		// focus, leaving the arrows below with no caret to move.
		await expect(content).toBeFocused()
		const field = await arrowUntilFieldOpens(page, 'ArrowRight')

		await expect(field).toBeFocused()
		expect(await caretPosition(field)).toEqual([0, 0])
	})

	// ProseMirror resolves the positions either side of an inline atom to the
	// same number, so arriving from the right is not distinguishable from
	// arriving from the left by selection alone, and the caret slides past the
	// image instead of entering it. Entry from the left and every other symptom
	// (the doubled caret, the field opening a keypress early) are fixed; this
	// direction needs a view-level `handleKeyDown` reading the DOM selection
	// before ProseMirror normalises it.
	test.fixme('arrowing on from the text after it opens the field with the caret at its end', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png) After')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		const box = await image.boundingBox()
		if (!box) throw new Error('image has no bounding box')
		await page.mouse.click(box.x + box.width + 10, box.y + box.height / 2)
		const field = await arrowUntilFieldOpens(page, 'ArrowLeft')

		await expect(field).toBeFocused()
		const value = await field.inputValue()
		expect(await caretPosition(field)).toEqual([value.length, value.length])
	})

	test('leaves no second caret in the document behind the field', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		await expect(content).toBeFocused()
		await arrowUntilFieldOpens(page, 'ArrowRight')

		// Focus is in the field, so the editor is not also drawing a caret of its
		// own - the two carets came from entry leaving a text selection behind
		// while the field opened alongside it.
		await expect(page.getByLabel('Image source')).toBeFocused()
		await expect(content).not.toBeFocused()
	})

	test('does not open the field while the caret is merely beside the image', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		await expect(content).toBeFocused()
		// One short of entry: the caret reaches the end of "Before ", adjacent to
		// the image but not on it.
		for (let press = 0; press < 'Before '.length; press++) {
			await page.keyboard.press('ArrowRight')
		}

		await expect(page.getByLabel('Image source')).toHaveCount(0)
	})
})
