import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

test.describe('Image editing in the live editor', () => {
	test('selecting the image reveals its markdown as editable text, image still visible', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		await image.click()

		await expect(image).toBeVisible()
		const field = page.getByLabel('Image source')
		await expect(field).toBeVisible()
		await expect(field).toHaveValue('![Diagram](./diagram.png)')
	})

	test('the revealed field hides again once the caret leaves the image', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some text.\n\n![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		await image.click()
		await expect(page.getByLabel('Image source')).toBeVisible()

		await content.getByText('Some text.').click()
		await expect(page.getByLabel('Image source')).toBeHidden()
	})

	test('editing the revealed text updates the rendered image', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		await image.click()
		const field = page.getByLabel('Image source')
		await field.fill('![New diagram](./new.png)')
		await field.blur()

		const updated = content.getByRole('img', { name: 'New diagram' })
		await expect(updated).toBeVisible()
		await expect(updated).toHaveAttribute('src', './new.png')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('![New diagram](./new.png)')
	})

	// Clearing the source is how an image is deleted from the field, the field
	// being the only editable form the image has. Restoring the old markdown
	// there - the shape every other repair pass had - leaves no way to remove
	// the image without leaving the field first.
	test('clearing the revealed text deletes the image', async ({ page }) => {
		await openInVSCode(page, 'Some text.\n\n![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await content.getByRole('img', { name: 'Diagram' }).click()
		const field = page.getByLabel('Image source')
		await field.fill('')
		await field.press('Enter')

		await expect(content.getByRole('img')).toHaveCount(0)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Some text.')
	})

	// A half-typed source is not a request to delete anything.
	test('restores the previous source when the text is not valid markdown', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some text.\n\n![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()

		await content.getByRole('img', { name: 'Diagram' }).click()
		const field = page.getByLabel('Image source')
		await field.fill('![Diagram](')
		await field.blur()

		await expect(content.getByRole('img', { name: 'Diagram' })).toBeVisible()
	})

	test('the "Edit source" toolbar button focuses the revealed field', async ({
		page,
	}) => {
		await openInVSCode(page, '![Diagram](./diagram.png)')
		const content = page.getByRole('textbox').first()
		const image = content.getByRole('img', { name: 'Diagram' })

		await image.click()
		await page.getByTitle('Edit source').click()

		await expect(page.getByLabel('Image source')).toBeFocused()
	})
})
