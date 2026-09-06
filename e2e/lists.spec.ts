import { readFileSync } from 'fs'

import { pasteText } from '@/e2e/lib/clipboard'
import { expect, test } from '@/e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '@/e2e/lib/press-key-settled'
import { openInVSCode } from '@/e2e/lib/vscode-host'

test.describe('Lists in the live editor', () => {
	test('typing "- " creates a bullet list item', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('- First item')

		await expect(
			content.locator('ul li', { hasText: 'First item' })
		).toBeVisible()
	})

	test('typing "1. " creates an ordered list item', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('1. First item')

		await expect(
			content.locator('ol li', { hasText: 'First item' })
		).toBeVisible()
	})

	test('typing "- [ ] " creates a task list item', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('- [ ] First item')

		await expect(
			content.locator('ul[data-type="taskList"] li', { hasText: 'First item' })
		).toBeVisible()
	})

	test('pressing Enter in a list item adds a new item on the next line', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('p').click())
		await page.keyboard.type('- First item')
		await pressKeySettled(page, 'Enter')
		await page.keyboard.type('Second item')

		// The `- ` marker is real, marked text now (see `list-marker.ts`), not
		// markup synthesized only at save time.
		const list = content.locator('ul').filter({ hasText: 'First item' })
		await expect(list.locator('li')).toHaveText([
			'- First item',
			'- Second item',
		])
	})

	test('pressing Enter in a nested list item adds a nested sibling', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('p').click())
		await page.keyboard.type('- First item')
		await pressKeySettled(page, 'Enter')
		await pressKeySettled(page, 'Tab')
		await page.keyboard.type('Nested item')
		await pressKeySettled(page, 'Enter')
		await page.keyboard.type('Nested sibling')

		const nestedList = content
			.locator('li', { hasText: 'First item' })
			.locator('ul')
		await expect(nestedList.locator('li')).toHaveText([
			'- Nested item',
			'- Nested sibling',
		])
	})

	// Tab fires the moment the caret is naturally at offset 0 (a fresh empty
	// item), rather than typing text and relocating the caret back there -
	// the latter races ProseMirror's own pickup of a Selection API move.
	test('Tab right after the bullet nests the list item', async ({ page }) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('p').click())
		await page.keyboard.type('- First item')
		await pressKeySettled(page, 'Enter')
		await pressKeySettled(page, 'Tab')
		await page.keyboard.type('Second item')

		const nestedList = content
			.locator('li', { hasText: 'First item' })
			.locator('ul')
		await expect(nestedList.locator('li')).toHaveText(['- Second item'])
	})

	test('Shift-Tab right after the bullet un-nests the list item', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('p').click())
		await page.keyboard.type('- First item')
		await pressKeySettled(page, 'Enter')
		await pressKeySettled(page, 'Tab')
		await pressKeySettled(page, 'Shift+Tab')
		await page.keyboard.type('Second item')

		const topLevelList = content.locator('ul').filter({ hasText: 'First item' })
		await expect(topLevelList.locator('> li')).toHaveText([
			'- First item',
			'- Second item',
		])
	})

	test('checking a task list item updates the raw markdown', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)

		await page
			.getByRole('listitem')
			.filter({ hasText: 'Incomplete task', hasNotText: 'Another' })
			.getByRole('checkbox')
			.click()
		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(/- \[x\] Incomplete task/)
	})

	test('unchecking a task list item updates the raw markdown', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)

		await page
			.getByRole('listitem')
			.filter({ hasText: 'Completed task' })
			.getByRole('checkbox')
			.click()
		await page.getByRole('button', { name: 'Raw editor' }).click()

		await expect(
			page.getByRole('textbox', { name: 'Raw markdown' })
		).toHaveValue(/- \[ \] Completed task/)
	})

	test('pasting a nested markdown list preserves its structure', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await pasteText(content, ['- First item', '  - Nested item'].join('\n'))

		const nestedList = content
			.locator('li', { hasText: 'First item' })
			.locator('ul')
		await expect(nestedList.locator('li')).toHaveText(['- Nested item'])
	})
})

test.describe('Deleting a list item down to empty in the live editor', () => {
	// Distinct from marker-backspace-boundary.spec.ts's marker-boundary case:
	// this deletes the item's *content* character by character, never touching
	// the marker directly, until the item is empty - a separate path into
	// the marker sync plugin's repair step than
	// block-marker/marker-backspace-extension.ts's boundary keymap covers.
	test('bullet list: deleting an item down to empty character by character does not duplicate the marker', async ({
		page,
	}) => {
		await openInVSCode(page, '- Eggs')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('li').click())
		await pressKeySettled(page, 'End')
		for (let i = 0; i < 'Eggs'.length; i++) {
			await pressKeySettled(page, 'Backspace')
		}

		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveValue('- ')
	})
})
