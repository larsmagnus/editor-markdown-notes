import { readFileSync } from 'fs'

import type { Page } from '@playwright/test'

import { expect, test } from '#e2e/lib/fixtures'
import {
	liveBlockTop,
	liveCaretTop,
	rawCaretTop,
	rawOffsetTop,
	selectInLive,
	selectInRaw,
} from '#e2e/lib/mode-switch-geometry'
import { actionSettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

/** Half a line of body text: under that, the reader sees no jump. */
const LINE_TOLERANCE_PX = 12

const NOTE = readFileSync('public/notes.md', 'utf8')

/**
 * Opens the demo note once everything that resizes it after load - images,
 * the mermaid diagram - has settled, so a position measured here is still
 * where it was when the mode switches.
 */
/** Viewport bottom of the sticky toolbar, where the visible band starts. */
async function toolbarBottom(page: Page): Promise<number> {
	return page
		.getByRole('toolbar')
		.first()
		.evaluate((toolbar) => toolbar.getBoundingClientRect().bottom)
}

async function openNote(page: Page) {
	await openInVSCode(page, NOTE)
	await expect(
		page.getByRole('img', { name: 'Mermaid diagram' }).first()
	).toBeVisible()
	await page.waitForLoadState('networkidle')
	await page.waitForFunction(() =>
		Array.from(document.images).every((image) => image.complete)
	)
}

const rawTextarea = (page: Page) =>
	page.getByRole('textbox', { name: 'Raw markdown' })

test.describe('Mode switch position', () => {
	test('carries a caret on screen into raw mode, at the same height', async ({
		page,
	}) => {
		await openNote(page)
		await actionSettled(page, () => selectInLive(page, 'cat sat on the mat'))
		const before = await liveCaretTop(page)

		await page.getByRole('button', { name: 'Raw editor' }).click()

		const raw = rawTextarea(page)
		await expect(raw).toBeFocused()
		await expect(raw).toHaveJSProperty(
			'selectionStart',
			NOTE.indexOf('cat sat on the mat')
		)
		expect(Math.abs((await rawCaretTop(page)) - before)).toBeLessThan(
			LINE_TOLERANCE_PX
		)

		// Diagrams, images and highlighting above the caret settle late.
		await page.waitForTimeout(1000)
		expect(Math.abs((await rawCaretTop(page)) - before)).toBeLessThan(
			LINE_TOLERANCE_PX
		)
	})

	test('carries a selection into raw mode', async ({ page }) => {
		const selected = 'ramifications of implementing'
		await openNote(page)
		await actionSettled(page, () =>
			selectInLive(page, selected, selected.length)
		)

		await page.getByRole('button', { name: 'Raw editor' }).click()

		const raw = rawTextarea(page)
		await expect(raw).toBeFocused()
		const range = await raw.evaluate((textarea: HTMLTextAreaElement) =>
			textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
		)
		expect(range).toBe(selected)
	})

	test('carries a caret and selection from raw mode into live mode, at the same height', async ({
		page,
	}) => {
		const selected = 'parsimonious selection'
		await openNote(page)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const start = NOTE.indexOf(selected)
		await selectInRaw(page, start, start + selected.length)
		const before = await rawCaretTop(page)

		await page.getByRole('button', { name: 'Live editor' }).click()

		await expect(page.locator('#live-editor')).toBeFocused()
		expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
			selected
		)
		expect(Math.abs((await liveCaretTop(page)) - before)).toBeLessThan(
			LINE_TOLERANCE_PX
		)
	})

	test('keeps the text at the top of the screen in place when the caret is off screen', async ({
		page,
	}) => {
		const heading = 'Long-form text: weak words and hedging test'
		await openNote(page)
		await page
			.locator('#live-editor > *', { hasText: heading })
			.first()
			.evaluate((element) => element.scrollIntoView({ block: 'start' }))
		await page
			.locator('.overflow-auto')
			.first()
			.evaluate((element) => element.scrollBy(0, -40))
		const before = await liveBlockTop(page, heading)

		await page.getByRole('button', { name: 'Raw editor' }).click()

		const after = await rawOffsetTop(page, NOTE.indexOf(`## ${heading}`))
		expect(Math.abs(after - before)).toBeLessThan(LINE_TOLERANCE_PX)
	})

	test('comes back to the same selection and scroll position after a round trip', async ({
		page,
	}) => {
		const selected = 'The committee made the final decision'
		await openNote(page)
		await actionSettled(page, () =>
			selectInLive(page, selected, selected.length)
		)
		const scrollTop = await page
			.locator('.overflow-auto')
			.first()
			.evaluate((element) => element.scrollTop)

		await page.getByRole('button', { name: 'Raw editor' }).click()
		await expect(rawTextarea(page)).toBeFocused()
		await page.getByRole('button', { name: 'Live editor' }).click()
		await expect(page.locator('#live-editor')).toBeFocused()

		expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
			selected
		)
		const after = await page
			.locator('.overflow-auto')
			.first()
			.evaluate((element) => element.scrollTop)
		expect(Math.abs(after - scrollTop)).toBeLessThan(LINE_TOLERANCE_PX)
	})

	test('keeps keystrokes typed just before switching, with the caret after them', async ({
		page,
	}) => {
		await openNote(page)
		await actionSettled(page, () =>
			selectInLive(page, ' It was warm in the sun.')
		)
		await actionSettled(page, () => page.keyboard.type(' Then it slept.'))

		await page.getByRole('button', { name: 'Raw editor' }).click()

		const raw = rawTextarea(page)
		await expect(raw).toHaveValue(/mat\. Then it slept\. It was warm/)
		await page.keyboard.type(' Soundly.')
		await expect(raw).toHaveValue(/mat\. Then it slept\. Soundly\. It was warm/)
	})

	test('leaves focus on the toggle when it is used from the keyboard, still carrying the caret', async ({
		page,
	}) => {
		await openNote(page)
		await actionSettled(page, () => selectInLive(page, 'cat sat on the mat'))

		const toggle = page.getByRole('button', { name: 'Raw editor' })
		await toggle.focus()
		await page.keyboard.press('Space')

		await expect(toggle).toBeFocused()
		await expect(rawTextarea(page)).toHaveJSProperty(
			'selectionStart',
			NOTE.indexOf('cat sat on the mat')
		)
	})

	test('a switch from the command palette is not pulled back to the remembered position', async ({
		page,
	}) => {
		const heading = 'Long-form text: weak words and hedging test'
		await page.addInitScript(() => {
			window.initialScrollTop = 600
		})
		await openNote(page)
		await page
			.locator('#live-editor > *', { hasText: heading })
			.first()
			.evaluate((element) => element.scrollIntoView({ block: 'start' }))
		const before = await liveBlockTop(page, heading)

		// What `punchdown.toggleRaw` broadcasts: nothing in the page is touched.
		await page.evaluate(() => {
			window.postMessage({
				type: 'config',
				settings: {},
				viewOptions: { raw: true },
			})
		})

		await expect(rawTextarea(page)).toBeVisible()
		// Long enough for the restore's own re-apply loop to have pulled the page
		// back, had it still been running.
		await page.waitForTimeout(1000)
		const after = await rawOffsetTop(page, NOTE.indexOf(`## ${heading}`))
		expect(Math.abs(after - before)).toBeLessThan(LINE_TOLERANCE_PX)
	})

	test('keeps a diagram straddling the top of the screen there, rather than jumping to the start', async ({
		page,
	}) => {
		await openNote(page)
		const bandTop = await toolbarBottom(page)
		await page
			.getByRole('img', { name: 'Mermaid diagram' })
			.first()
			.evaluate((diagram, bandTop) => {
				const container = document.querySelector('.overflow-auto')
				const top = diagram.getBoundingClientRect().top
				container?.scrollBy(0, top - bandTop + 40)
			}, bandTop)

		await page.getByRole('button', { name: 'Raw editor' }).click()

		const fenceTop = await rawOffsetTop(page, NOTE.indexOf('```mermaid'))
		expect(fenceTop).toBeGreaterThan(-200)
		expect(fenceTop).toBeLessThan(bandTop + 200)
	})

	test('keeps a caret inside diagram source on screen once the diagram renders', async ({
		page,
	}) => {
		await openNote(page)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		await selectInRaw(page, NOTE.indexOf('C[Finish]'))

		await page.getByRole('button', { name: 'Live editor' }).click()

		const diagram = await page
			.getByRole('img', { name: 'Mermaid diagram' })
			.first()
			.boundingBox()
		const viewport = page.viewportSize()
		expect(diagram).not.toBeNull()
		expect(viewport).not.toBeNull()
		expect(diagram?.y ?? -1).toBeLessThan(viewport?.height ?? 0)
		expect((diagram?.y ?? -1) + (diagram?.height ?? 0)).toBeGreaterThan(0)
	})

	test('keeps the text below a blank line at the top of the screen in place', async ({
		page,
	}) => {
		const heading = 'Long-form text: weak words and hedging test'
		await openNote(page)
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const bandTop = await toolbarBottom(page)
		const blankLine = NOTE.indexOf(`\n\n## ${heading}`) + 1
		const top = await rawOffsetTop(page, blankLine - 1)
		await page
			.locator('.overflow-auto')
			.first()
			.evaluate(
				(container, delta) => container.scrollBy(0, delta),
				top - bandTop + 22
			)

		await page.getByRole('button', { name: 'Live editor' }).click()

		const after = await liveBlockTop(page, heading)
		expect(Math.abs(after - bandTop)).toBeLessThan(60)
	})
})
