import type { Page } from '@playwright/test'

import { expect, test } from '@/e2e/lib/fixtures'
import { pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

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

/**
 * Arrowing past an image never traps the caret on it, and never silently
 * deletes it either: `createImageStepOverPlugin` (`keyboard-nav.ts`) steps a
 * plain arrow key straight past the image as a collapsed caret, so it never
 * becomes the browser's own native Range-selects-the-atom behavior that a
 * subsequent keystroke would type over. The image gets a "soft focus"
 * instead - visible when the caret sits right next to it
 * (`use-image-caret-adjacent.ts`) - which shows its toolbar without ever
 * making it the actual `NodeSelection` a hard focus would need Tab or a click
 * to leave.
 */
test.describe('Arrow-key movement across an image in the live editor', () => {
	test('arrowing right from before the image continues into the text after it', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png) After')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		await expect(content).toBeFocused()
		await pressKeySettled(page, 'Home')

		// "Before " (7) + the image (1) + " After"'s leading space (1) lands the
		// caret right before "After".
		for (let press = 0; press < 9; press++) {
			await pressKeySettled(page, 'ArrowRight')
		}
		await page.keyboard.type('X')

		await expect(page.getByRole('img', { name: 'Diagram' })).toBeVisible()
		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Before ![Diagram](./diagram.png) XAfter')
	})

	test('arrowing left from after the image continues into the text before it', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png) After')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		// Past the image's own *frame*, not just the `<img>` - the frame has its
		// own minimum-size floor to fit the toolbar, wider than a broken test
		// image, so an offset from the `<img>` alone can still land inside it.
		const frame = image.locator('xpath=../..')
		const box = await frame.boundingBox()
		if (!box) throw new Error('image frame has no bounding box')
		await page.mouse.click(box.x + box.width + 10, box.y + box.height / 2)
		await pressKeySettled(page, 'End')

		// " After" (6) + the image (1) lands the caret right before "Before "'s
		// trailing space.
		for (let press = 0; press < 7; press++) {
			await pressKeySettled(page, 'ArrowLeft')
		}
		await page.keyboard.type('X')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Before X![Diagram](./diagram.png) After')
	})

	test('the toolbar reveals while the caret sits right next to the image', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const toolbar = toolbarOpacity(page)

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		await expect(content).toBeFocused()
		await expect(toolbar).toHaveCSS('opacity', '0')

		await pressKeySettled(page, 'Home')
		for (let press = 0; press < 'Before '.length; press++) {
			await pressKeySettled(page, 'ArrowRight')
		}

		await expect(toolbar).toHaveCSS('opacity', '1')
	})

	test('the toolbar hides again once the caret moves away', async ({
		page,
	}) => {
		await openInVSCode(page, 'Before ![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const toolbar = toolbarOpacity(page)

		await content.locator('p').click({ position: { x: 2, y: 2 } })
		await pressKeySettled(page, 'Home')
		for (let press = 0; press < 'Before '.length; press++) {
			await pressKeySettled(page, 'ArrowRight')
		}
		await expect(toolbar).toHaveCSS('opacity', '1')

		await pressKeySettled(page, 'Home')
		await expect(toolbar).toHaveCSS('opacity', '0')
	})
})
