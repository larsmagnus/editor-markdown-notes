import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

function caretPosition(field: Locator) {
	return field.evaluate((el: HTMLInputElement) => [
		el.selectionStart,
		el.selectionEnd,
	])
}

test.describe('Arrow-key entry onto an image in the live editor', () => {
	test('arrowing on from the text before it opens the field with the caret at its start', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		// The paragraph's own text (`getByText` with `exact: false` on a
		// paragraph containing an image matches the whole paragraph, whose
		// bounding box center can land on the image itself) - clicking near its
		// left edge instead reliably lands in "Before". ArrowRight the length of
		// "Before " walks to right before the image; one more triggers entry.
		await content.locator('p').click({ position: { x: 2, y: 2 } })
		for (let i = 0; i < 'Before '.length + 1; i++) {
			await page.keyboard.press('ArrowRight')
		}

		const field = page.getByLabel('Image source')
		await expect(field).toBeFocused()
		expect(await caretPosition(field)).toEqual([0, 0])
	})

	test('arrowing on from the text after it opens the field with the caret at its end', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png) After')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		// Click just past the image's right edge, landing in " After" rather
		// than reselecting the image - then ArrowLeft the length of " After"
		// walks back to right after the image; one more triggers entry.
		const box = await image.boundingBox()
		if (!box) throw new Error('image has no bounding box')
		await page.mouse.click(box.x + box.width + 10, box.y + box.height / 2)
		for (let i = 0; i < ' After'.length + 1; i++) {
			await page.keyboard.press('ArrowLeft')
		}

		const field = page.getByLabel('Image source')
		await expect(field).toBeFocused()
		const value = await field.inputValue()
		expect(await caretPosition(field)).toEqual([value.length, value.length])
	})
})
