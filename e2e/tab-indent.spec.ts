import { expect, test } from '@playwright/test'

import { openInVSCode } from '@/e2e/lib/helpers'

/**
 * Tab means "indent" wherever there is a real text caret, rather than moving
 * focus out of the editor - except right after a list item's marker, where it
 * nests the item instead.
 */
test.describe('Tab in the live editor', () => {
	test('inserts an indent in a paragraph', async ({ page }) => {
		await openInVSCode(page, 'Some text.')
		const content = page.getByRole('textbox').first()

		await content.getByText('Some text.').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		await page.keyboard.press('Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('  Some text.')
	})

	test('indents the code inside a code block', async ({ page }) => {
		await openInVSCode(page, '```ts\nconst a = 1\n```')
		const content = page.getByRole('textbox').first()

		await content.getByText('const a = 1').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		await page.keyboard.press('Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('```ts\n  const a = 1\n```\n')
	})

	test('indents the YAML inside a frontmatter block', async ({ page }) => {
		await openInVSCode(page, '---\ntitle: Roadmap\n---\n\n# Notes')
		const content = page.getByRole('textbox').first()

		await page.getByLabel('Edit frontmatter source').click()
		await content.getByText('title: Roadmap').click()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		await page.keyboard.press('Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('---\n  title: Roadmap\n---\n\n# Notes')
	})

	test('Shift-Tab removes a preceding indent', async ({ page }) => {
		await openInVSCode(page, '```ts\n  const a = 1\n```')
		const content = page.getByRole('textbox').first()

		await content.getByText('const a = 1').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		await page.keyboard.press('Shift+Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('```ts\nconst a = 1\n```\n')
	})

	test('Shift-Tab with nothing to outdent keeps the caret in the editor', async ({
		page,
	}) => {
		await openInVSCode(page, 'Some text.')
		const content = page.getByRole('textbox').first()

		await content.getByText('Some text.').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		await page.keyboard.press('Shift+Tab')

		await expect(content).toBeFocused()
		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('Some text.')
	})

	test('nests a task list item pressed right after its checkbox', async ({
		page,
	}) => {
		await openInVSCode(page, '- [ ] First\n- [ ] Second')
		const content = page.getByRole('textbox').first()

		await content.getByText('Second').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('Home')
		await page.waitForTimeout(100)
		for (let index = 0; index < 6; index += 1) {
			await page.keyboard.press('ArrowRight')
			await page.waitForTimeout(100)
		}
		await page.keyboard.press('Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('- [ ] First\n  - [ ] Second')
	})

	test('indents rather than nesting when the caret is past the marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- Buy milk')
		const content = page.getByRole('textbox').first()

		await content.getByText('Buy milk').click()
		await expect(content).toBeFocused()
		await page.keyboard.press('End')
		await page.waitForTimeout(100)
		await page.keyboard.press('Tab')

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue('- Buy milk  ')
	})
})
