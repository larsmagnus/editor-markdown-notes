import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import type { Page } from '@playwright/test'

import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

const CORPUS = 'fixtures/markdown/adversarial'

/** Offsets to probe: the first visible character of every line, plus a few inside the longest ones. */
function probeOffsets(text: string): number[] {
	const offsets: number[] = []
	let start = 0
	for (const line of text.split('\n')) {
		if (line.trim() !== '') {
			offsets.push(start + line.search(/\S/))
			if (line.length > 80) {
				offsets.push(
					start + Math.floor(line.length / 2),
					start + line.length - 1
				)
			}
		}
		start += line.length + 1
	}
	return offsets
}

/**
 * Clicks the left edge of the character the mirror shows at each offset,
 * scrolled into view first, and reports where the textarea put its caret -
 * which is the offset itself whenever the two layers lay the text out
 * identically. Characters too narrow to click inside (zero-width, combining),
 * and any the toolbar covers, are skipped.
 */
async function caretOffsetsAfterClicking(page: Page, offsets: number[]) {
	const raw = page.getByRole('textbox', { name: 'Raw markdown' })
	const reached: Array<{ target: number; caret: number }> = []
	for (const target of offsets) {
		const point = await mirrorPoint(page, target, true)
		if (!point || point.width < 4 || !point.reachable) continue
		await page.mouse.click(point.x + 1, point.y)
		const caret = await raw.evaluate(
			(element: HTMLTextAreaElement) => element.selectionStart
		)
		reached.push({ target, caret })
	}
	return reached
}

/**
 * The raw view is a transparent textarea over a colored mirror of its text.
 * Wherever the two lay a line out differently, a click or a drag lands on
 * different text than the author sees - and a selection deleted there deletes
 * something else. Every note in the adversarial corpus must line up from top
 * to bottom.
 */
test.describe('Raw view mirror alignment', () => {
	for (const file of readdirSync(CORPUS).filter((name) =>
		name.endsWith('.md')
	)) {
		test(`lines up with the textarea throughout ${file}`, async ({ page }) => {
			const note = readFileSync(join(CORPUS, file), 'utf8')
			await openInVSCode(page, note)
			await page.getByRole('button', { name: 'Raw editor' }).click()
			const text = await page
				.getByRole('textbox', { name: 'Raw markdown' })
				.inputValue()

			const reached = await caretOffsetsAfterClicking(page, probeOffsets(text))

			expect(reached.filter(({ target, caret }) => target !== caret)).toEqual(
				[]
			)
		})
	}

	test('lines up with the textarea throughout a five-thousand-line note', async ({
		page,
	}) => {
		const corpus = readdirSync(CORPUS)
			.filter((name) => name.endsWith('.md'))
			.map((name) => readFileSync(join(CORPUS, name), 'utf8'))
			.join('\n\n')
		const note = Array.from({ length: 20 }, () => corpus).join('\n\n')
		await openInVSCode(page, note)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const text = await page
			.getByRole('textbox', { name: 'Raw markdown' })
			.inputValue()

		const offsets = probeOffsets(text)
		const sample = offsets.filter((_offset, index) => index % 40 === 0)
		const reached = await caretOffsetsAfterClicking(page, sample)

		expect(text.split('\n').length).toBeGreaterThan(5000)
		expect(reached.filter(({ target, caret }) => target !== caret)).toEqual([])
	})

	test('shows the plain text instead once the highlighting stops lining up', async ({
		page,
	}) => {
		await openInVSCode(page, 'Ship it.\n\nDone.\n')
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await expect(raw).toHaveCSS('color', 'rgba(0, 0, 0, 0)')

		// Anything that makes the mirror wrap differently - here, wider glyphs.
		await page.addStyleTag({
			content: 'pre[aria-hidden="true"] { letter-spacing: 40px; }',
		})
		await raw.click()
		await page.keyboard.type(' More text to wrap the line.')

		await expect(raw).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)')
	})

	test('deletes exactly the selected text past a long unbroken line', async ({
		page,
	}) => {
		const url = `https://example.com/${'a'.repeat(400)}`
		const note = `Intro ${url} end.\n\nKeep this line.\nDelete THIS word only.\n`
		await openInVSCode(page, note)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })

		const start = note.indexOf('THIS')
		const from = await mirrorPoint(page, start)
		const to = await mirrorPoint(page, start + 'THIS '.length)
		if (!from || !to) throw new Error('selection end not in the mirror')
		await page.mouse.move(from.x, from.y)
		await page.mouse.down()
		await page.mouse.move(to.x, to.y)
		await page.mouse.up()
		await page.keyboard.press('Delete')

		await expect(raw).toHaveValue(note.replace('THIS ', ''))
	})
})

/**
 * Where the mirror draws the character at `offset`, in page coordinates,
 * scrolling it into view first - mouse events only reach what is on screen.
 */
async function mirrorPoint(page: Page, offset: number, whole = false) {
	return page.evaluate(
		({ target, wholeCharacter }) => {
			const pre = document.querySelector(
				'pre[aria-hidden="true"]:not([data-testid])'
			)
			if (!pre) throw new Error('mirror not found')
			const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
			let start = 0
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				const length = node.textContent?.length ?? 0
				if (target < start + length) {
					node.parentElement?.scrollIntoView({ block: 'center' })
					const range = document.createRange()
					range.setStart(node, target - start)
					range.setEnd(node, target - start + (wholeCharacter ? 1 : 0))
					const rect = range.getBoundingClientRect()
					const y = (rect.top + rect.bottom) / 2
					return {
						x: rect.left,
						y,
						width: rect.width,
						reachable:
							document.elementFromPoint(rect.left + 1, y)?.tagName ===
							'TEXTAREA',
					}
				}
				start += length
			}
			return null
		},
		{ target: offset, wholeCharacter: whole }
	)
}
