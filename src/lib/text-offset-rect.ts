/**
 * Viewport rect of the character at `offset` in `root`'s text, or `null` when
 * the offset is past the end. Measures the mirror rather than the textarea,
 * which exposes no layout for a character.
 */
export function textOffsetRect(
	root: HTMLElement,
	offset: number
): DOMRect | null {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	let remaining = offset

	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const length = node.textContent?.length ?? 0
		if (remaining >= length) {
			remaining -= length
			continue
		}
		const range = document.createRange()
		range.setStart(node, remaining)
		range.setEnd(node, remaining + 1)
		return range.getBoundingClientRect()
	}
	return null
}
