import type { Page } from '@playwright/test'

export interface CaretGeometry {
	/** Characters of the block's text before the caret. */
	index: number
	/** Where the browser reports the caret, or `null` when it has no rect. */
	caretX: number | null
	/** Left edge of the glyph at `index` - the right edge of the last one at the end. */
	glyphX: number
}

/**
 * Self-contained on purpose: this runs via `page.evaluate`, which serializes
 * only a function's own source text.
 */
function measureCaret(blockSelector: string): CaretGeometry | null {
	const block = document.querySelector(blockSelector)
	const selection = document.getSelection()
	if (!block || !selection || selection.rangeCount === 0) return null

	const caret = selection.getRangeAt(0).cloneRange()
	caret.collapse(true)

	const toCaret = document.createRange()
	toCaret.selectNodeContents(block)
	toCaret.setEnd(caret.startContainer, caret.startOffset)
	const index = toCaret.toString().length

	const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
	const characters: Range[] = []
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const length = node.textContent?.length ?? 0
		for (let offset = 0; offset < length; offset += 1) {
			const character = document.createRange()
			character.setStart(node, offset)
			character.setEnd(node, offset + 1)
			characters.push(character)
		}
	}

	const atEnd = index >= characters.length
	const glyph = characters[atEnd ? characters.length - 1 : index]
	if (!glyph) return null
	const glyphBox = glyph.getBoundingClientRect()

	const caretRect = caret.getClientRects()[0]
	return {
		index,
		caretX: caretRect ? caretRect.left : null,
		glyphX: atEnd ? glyphBox.right : glyphBox.left,
	}
}

/** Where the caret is drawn against where the character it sits before is. */
export async function readCaretGeometry(page: Page, blockSelector: string) {
	const geometry = await page.evaluate(measureCaret, blockSelector)
	if (!geometry) throw new Error(`No caret inside ${blockSelector}`)
	return geometry
}
