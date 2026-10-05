import type { Page } from '@playwright/test'

import { readCaretGeometry } from '#e2e/lib/caret-geometry'
import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

const SUBPIXEL = 1

/**
 * Inline code pads its pill by 0.3em of its own 0.85em font size, and the
 * caret sits outside the pill. Layout rounds to a fraction of a pixel either
 * side of that.
 */
const INLINE_CODE_PADDING = 0.3 * 0.85 * 16 + SUBPIXEL

/**
 * A caret beside revealed syntax has to be drawn on the edge of a character.
 * One drawn between a marker and its text, across a margin, lands inside a
 * glyph - and the arrow press that only crosses that boundary looks dead.
 */
async function expectCaretOnCharacterEdge(
	page: Page,
	block: string,
	tolerance = SUBPIXEL
) {
	const caret = await readCaretGeometry(page, block)
	expect(caret.caretX).not.toBeNull()
	expect(Math.abs((caret.caretX ?? 0) - caret.glyphX)).toBeLessThanOrEqual(
		tolerance
	)
	return caret.index
}

const LISTS = [
	{ name: 'bullet', markdown: '- item', block: 'li p', markerLength: 2 },
	{ name: 'ordered', markdown: '1. item', block: 'li p', markerLength: 3 },
	{
		name: 'task',
		markdown: '- [ ] item',
		block: '[data-type="taskItem"] p',
		markerLength: 6,
	},
	{
		name: 'nested bullet',
		markdown: '- parent\n  - item',
		block: 'li li p',
		markerLength: 2,
	},
] as const

test.describe('The caret beside a revealed list marker', () => {
	for (const list of LISTS) {
		test(`moves one character per press from the start of a ${list.name} item`, async ({
			page,
		}) => {
			await openInVSCode(page, `${list.markdown}\n\nBody text.`)
			const content = page.getByRole('textbox').first()

			await actionSettled(page, () =>
				content.locator(list.block).getByText('item').click()
			)
			await pressKeySettled(page, 'End')
			await pressKeySettled(page, 'Home')

			let previous = await expectCaretOnCharacterEdge(page, list.block)
			for (let step = 0; step < list.markerLength + 3; step += 1) {
				await pressKeySettled(page, 'ArrowRight')
				const index = await expectCaretOnCharacterEdge(page, list.block)
				expect(index).toBe(previous + 1)
				previous = index
			}
		})
	}
})

const MARKS = [
	{ name: 'bold', markdown: 'a **bold** z', tolerance: SUBPIXEL },
	{ name: 'italic', markdown: 'a _italic_ z', tolerance: SUBPIXEL },
	{ name: 'strikethrough', markdown: 'a ~~struck~~ z', tolerance: SUBPIXEL },
	{
		name: 'inline code',
		markdown: 'a `coded` z',
		tolerance: INLINE_CODE_PADDING,
	},
	{
		name: 'link',
		markdown: 'a [linked](https://example.com) z',
		tolerance: SUBPIXEL,
	},
] as const

test.describe('The caret inside a revealed inline mark', () => {
	for (const mark of MARKS) {
		test(`sits on a character edge at every step across ${mark.name} text`, async ({
			page,
		}) => {
			await openInVSCode(page, `${mark.markdown}\n\nBody text.`)
			const content = page.getByRole('textbox').first()

			await actionSettled(page, () => content.locator('p').first().click())
			await pressKeySettled(page, 'Home')

			let previous = await expectCaretOnCharacterEdge(
				page,
				'.ProseMirror p',
				mark.tolerance
			)
			for (let step = 0; step < mark.markdown.length; step += 1) {
				await pressKeySettled(page, 'ArrowRight')
				const index = await expectCaretOnCharacterEdge(
					page,
					'.ProseMirror p',
					mark.tolerance
				)
				expect(index).toBeGreaterThan(previous)
				previous = index
			}
		})
	}
})
