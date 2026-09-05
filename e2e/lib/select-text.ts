import type { Locator } from '@playwright/test'

/**
 * Selects the first occurrence of `needle` within `locator`'s text via the
 * native `Selection`/`Range` API, rather than walking there with repeated
 * arrow keys - for tests where the point is what happens after the selection
 * exists, not how a user's arrow keys would have built it (that's what
 * `keyboard-navigation.spec.ts` and the per-construct boundary specs are for).
 */
export async function selectSubstring(locator: Locator, needle: string) {
	await locator.evaluate((element, text) => {
		const haystack = element.textContent ?? ''
		const start = haystack.indexOf(text)
		if (start < 0) {
			throw new Error(`"${text}" not found in "${haystack}"`)
		}

		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
		let offset = 0
		let startNode: Text | null = null
		let startOffset = 0
		let endNode: Text | null = null
		let endOffset = 0

		for (
			let node = walker.nextNode() as Text | null;
			node;
			node = walker.nextNode() as Text | null
		) {
			const length = node.textContent?.length ?? 0
			if (!startNode && offset + length > start) {
				startNode = node
				startOffset = start - offset
			}
			if (!endNode && offset + length >= start + text.length) {
				endNode = node
				endOffset = start + text.length - offset
				break
			}
			offset += length
		}

		if (!startNode || !endNode) {
			throw new Error(`could not resolve a range for "${text}"`)
		}

		const range = document.createRange()
		range.setStart(startNode, startOffset)
		range.setEnd(endNode, endOffset)

		const selection = document.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)
	}, needle)
}
