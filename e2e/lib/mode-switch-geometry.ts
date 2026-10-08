import type { Page } from '@playwright/test'

/**
 * Collapses the live editor's selection at the start of `needle`, or selects
 * `length` characters from there, and scrolls that text to the middle of the
 * screen. Collapsed carets are why this is not `selectSubstring`.
 */
export async function selectInLive(page: Page, needle: string, length = 0) {
	await page.evaluate(
		({ needle, length }) => {
			const root = document.getElementById('live-editor')
			if (!root) throw new Error('The live editor is not mounted')

			const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				const index = node.textContent?.indexOf(needle) ?? -1
				if (index < 0) continue

				node.parentElement?.scrollIntoView({ block: 'center' })
				root.focus({ preventScroll: true })
				document
					.getSelection()
					?.setBaseAndExtent(node, index, node, index + length)
				return
			}
			throw new Error(`"${needle}" is not in the live editor`)
		},
		{ needle, length }
	)
}

/** Selects in the raw textarea and scrolls that text to the middle of the screen. */
export async function selectInRaw(page: Page, start: number, end = start) {
	await page.evaluate(
		({ start, end }) => {
			const textarea = document.getElementById('raw-markdown-editor')
			if (!(textarea instanceof HTMLTextAreaElement))
				throw new Error('Raw mode is not mounted')

			textarea.focus({ preventScroll: true })
			textarea.setSelectionRange(start, end)
		},
		{ start, end }
	)
	const top = await rawOffsetTop(page, start)
	await page.evaluate((top) => {
		const container = document.querySelector('.overflow-auto')
		// A wheel first, as a reader's scroll begins: it is what lets go of
		// the hold a mode switch keeps on the caret's place, which would
		// otherwise pull a scroll from script straight back.
		container?.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
		container?.scrollBy(0, top - window.innerHeight / 2)
	}, top)
}

/** Viewport top of the live editor's caret (the selection's focus end). */
export async function liveCaretTop(page: Page): Promise<number> {
	return page.evaluate(() => {
		const selection = document.getSelection()
		if (!selection?.focusNode) throw new Error('The live editor has no caret')

		const range = document.createRange()
		range.setStart(selection.focusNode, selection.focusOffset)
		const rect = range.getClientRects()[0] ?? range.getBoundingClientRect()
		return rect.top
	})
}

/** Viewport top of the first live-editor block containing `text`. */
export async function liveBlockTop(page: Page, text: string): Promise<number> {
	return page
		.locator('#live-editor > *', { hasText: text })
		.first()
		.evaluate((element) => element.getBoundingClientRect().top)
}

/**
 * Viewport top of the raw source character at `offset`, measured on the
 * mirror laid out behind the textarea - the textarea itself exposes no
 * per-character geometry.
 */
export async function rawOffsetTop(
	page: Page,
	offset: number
): Promise<number> {
	return page.evaluate((offset) => {
		const mirror = document.getElementById(
			'raw-markdown-editor'
		)?.previousElementSibling
		if (!mirror) throw new Error('Raw mode is not mounted')

		const walker = document.createTreeWalker(mirror, NodeFilter.SHOW_TEXT)
		let remaining = offset
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			const length = node.textContent?.length ?? 0
			if (remaining < length) {
				const range = document.createRange()
				range.setStart(node, remaining)
				range.setEnd(node, remaining + 1)
				return range.getBoundingClientRect().top
			}
			remaining -= length
		}
		throw new Error('The offset is past the end of the mirror')
	}, offset)
}

/** Viewport top of the raw textarea's caret (the selection's head). */
export async function rawCaretTop(page: Page): Promise<number> {
	const head = await page.evaluate(() => {
		const textarea = document.getElementById('raw-markdown-editor')
		if (!(textarea instanceof HTMLTextAreaElement))
			throw new Error('Raw mode is not mounted')

		return textarea.selectionDirection === 'backward'
			? textarea.selectionStart
			: textarea.selectionEnd
	})
	return rawOffsetTop(page, head)
}
