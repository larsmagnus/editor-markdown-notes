/**
 * Table cells here hold inline content directly, so a pasted `<td><p>…</p></td>`
 * - what Docs, Notion, Excel and most rendered pages produce - has nowhere to
 * put its paragraph and the cell arrives empty. Flattening the blocks to inline
 * before ProseMirror parses is what keeps the text.
 */

const BLOCK_CELL_CHILDREN =
	'p, div, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote'

/** Is there anything here a reader would see? */
function hasContent(node: Node | null): boolean {
	return !!node?.textContent?.trim()
}

/**
 * Replaces one block child with its own content, and a `<br>` wherever that
 * leaves two lines' worth of content running together. False when the cell
 * holds nothing more to unwrap.
 *
 * One at a time, because unwrapping a `<div>` or a `<ul>` exposes the blocks
 * inside it, which are then the ones to unwrap.
 */
function unwrapBlockChild(cell: Element): boolean {
	const block = Array.from(cell.children).find((child) =>
		child.matches(BLOCK_CELL_CHILDREN)
	)

	if (!block) return false

	const lineBreak = () => cell.ownerDocument.createElement('br')

	if (hasContent(block)) {
		if (hasContent(block.previousSibling)) block.before(lineBreak())
		if (hasContent(block.nextSibling)) block.after(lineBreak())
	}

	block.replaceWith(...Array.from(block.childNodes))

	return true
}

/**
 * Rewrites a cell in place so it holds inline content only.
 *
 * In place rather than by rebuilding `innerHTML` from the blocks found inside
 * it: a cell is free to mix them with bare text, and collecting only the blocks
 * dropped the rest. Anything with no inline equivalent at all - a nested table
 * - is left where it is for the schema to reject.
 */
function flattenCell(cell: Element): void {
	while (unwrapBlockChild(cell));
}

/**
 * Rewrites pasted HTML so every table cell holds inline content only.
 *
 * A no-op for the overwhelming majority of pastes, which is why the cheap
 * `<table` test comes first.
 */
export function flattenPastedCells(html: string): string {
	if (!html.includes('<table')) return html

	const container = document.createElement('div')
	container.innerHTML = html
	container.querySelectorAll('td, th').forEach(flattenCell)

	return container.innerHTML
}
