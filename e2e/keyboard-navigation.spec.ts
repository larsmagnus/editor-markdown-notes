import { readFileSync } from 'fs'

import { expect, test } from '#e2e/lib/fixtures'
import { tabUntilFocused } from '#e2e/lib/focus'
import { actionSettled } from '#e2e/lib/press-key-settled'
import { collectTabWalk } from '#e2e/lib/tab-walk'
import { openInVSCode } from '#e2e/lib/vscode-host'

test.describe('Keyboard navigation in the live editor', () => {
	test('Tab walks every interactive element in the document and the text tools sidebar exactly once', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)
		await page.getByRole('button', { name: 'Toggle text tools' }).click()

		const signatures = await collectTabWalk(page)

		expect(new Set(signatures).size).toBe(signatures.length)
		// Sanity check the walk covered real content, not just the toolbar.
		expect(signatures.length).toBeGreaterThan(30)
	})

	test('Tab from outside the editor reaches the frontmatter panel before the body, in visual order', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)

		// The frontmatter panel sits above the body, so Tab from the toolbar
		// has to reach its buttons first, not skip straight to the body.
		await tabUntilFocused(
			page,
			page.getByRole('button', { name: 'Copy frontmatter' })
		)
		await page.keyboard.press('Tab')
		await expect(
			page.getByRole('button', { name: 'Delete frontmatter' })
		).toBeFocused()

		// No Escape needed: real focus already left the caret for a button.
		await page.keyboard.press('Tab')
		await page.keyboard.press('Q')

		// The `#` marker is real, marked text now (see `heading-extension.ts`),
		// not markup synthesized only at save time.
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(
			/^# QEditor Markdown Notes/
		)
	})

	test('Escape then Tab moves focus to the next interactive element instead of indenting', async ({
		page,
	}) => {
		await openInVSCode(
			page,
			[
				'A paragraph with no controls nearby.',
				'',
				'```js',
				"console.log('first')",
				'```',
				'',
				'```js',
				"console.log('second')",
				'```',
			].join('\n')
		)
		const content = page.getByRole('textbox').first()
		const paragraph = content.locator('p').first()
		const copyButtons = page.getByRole('button', { name: 'Copy code' })

		// Escape reads its arm position from ProseMirror's selection state, so the
		// click has to have settled first or it arms at a stale position. Shiki's
		// async re-render of each code block can still be in flight too - wait for
		// both to finish coloring, or the re-render can land between Escape and Tab
		// and lose the one-shot.
		await actionSettled(page, () => paragraph.click())
		await expect(content).toBeFocused()
		await expect(
			content.locator('pre code span[style*="color"]').first()
		).toBeVisible()
		await expect(
			content.locator('pre code span[style*="color"]').last()
		).toBeVisible()
		await page.keyboard.press('Escape')
		await page.keyboard.press('Tab')

		await expect(copyButtons.first()).toBeFocused()
		await expect(paragraph).toHaveText('A paragraph with no controls nearby.')

		// No Escape needed for a second hop: real focus already sits on a button.
		await page.keyboard.press('Tab')
		await expect(copyButtons.nth(1)).toBeFocused()
	})

	test('Escape then Shift-Tab moves focus backward to the frontmatter panel', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)
		const editor = page.getByRole('textbox').first()

		await tabUntilFocused(page, editor)
		await page.keyboard.press('Escape')
		await page.keyboard.press('Shift+Tab')

		await expect(
			page.getByRole('button', { name: 'Delete frontmatter' })
		).toBeFocused()
	})

	test('Escape then Shift-Tab exits a plain-text document with nothing interactive in it', async ({
		page,
	}) => {
		await openInVSCode(page, 'Just a paragraph with nothing interactive.')
		const content = page.getByRole('textbox').first()

		await actionSettled(page, () => content.locator('p').click())
		await expect(content).toBeFocused()
		await page.keyboard.press('Escape')
		await page.keyboard.press('Shift+Tab')

		await expect(
			content.evaluate((element) => element.contains(document.activeElement))
		).resolves.toBe(false)
	})

	test('Tab with no preceding Escape still inserts an indent, unchanged', async ({
		page,
	}) => {
		await openInVSCode(page, '')
		const content = page.getByRole('textbox').first()

		await content.locator('p').click()
		await page.keyboard.type('First line')
		await page.keyboard.press('Tab')

		await expect(content.locator('p').first()).toHaveText('  First line')
	})

	test('Skip links reach the text tools sidebar directly, and back-link out of it', async ({
		page,
	}) => {
		const content = readFileSync('public/notes.md', 'utf8')
		await openInVSCode(page, content)
		await page.getByRole('button', { name: 'Toggle text tools' }).click()

		const sidebar = page.getByRole('complementary', { name: 'Text tools' })

		// The overall Tab order is covered by the full-document walk above;
		// this only needs the link itself focused, the way arriving there by
		// Tab (forward or back) already leaves it.
		await page.getByRole('link', { name: 'Skip to text tools' }).focus()
		await page.keyboard.press('Enter')
		await expect(sidebar).toBeFocused()

		// The back-link is the sidebar's first Tab stop, not the last thing
		// reached after tabbing through every rule toggle.
		await page.keyboard.press('Tab')
		await expect(
			sidebar.getByRole('link', { name: 'Skip to editor' })
		).toBeFocused()

		await page.keyboard.press('Enter')
		await expect(sidebar).not.toBeFocused()
		await expect(
			page.getByRole('button', { name: 'Edit frontmatter source' })
		).toBeFocused()
	})
})
