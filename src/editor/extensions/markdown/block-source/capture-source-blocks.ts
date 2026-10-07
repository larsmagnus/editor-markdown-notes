import type { MarkdownIt, StateCore, Token } from 'markdown-it'

import { describeStructure } from '#src/editor/extensions/markdown/block-source/same-structure'

/** Carried on each top-level block's opening tag, for `sourceId` to read back off the DOM. */
export const SOURCE_ID_ATTRIBUTE = 'data-source-id'

/** A horizontal rule's own line as written, for its node to show rather than a stock `---`. */
export const RULE_TEXT_ATTRIBUTE = 'data-rule-text'

/** A list item's marker as written - `*`, `+`, `3)` - for its node to show rather than a stock `-` or renumbered one. */
export const LIST_MARKER_ATTRIBUTE = 'data-list-marker'

const WRITTEN_LIST_MARKER = /^[ \t>]*([-+*]|\d{1,9}[.)])/

export type CapturedBlock = {
	id: number
	map: [number, number]
	/** What the block means, however it was spelled (`describeStructure`). */
	structure: string[]
}

const captures = new WeakMap<MarkdownIt, CapturedBlock[]>()
const installed = new WeakSet<MarkdownIt>()
let nextSourceId = 1

/** The index one past the token closing the block `tokens[start]` opens. */
function blockEnd(tokens: Token[], start: number): number {
	if (tokens[start].nesting !== 1) return start + 1

	let depth = 0
	for (let index = start; index < tokens.length; index++) {
		depth += tokens[index].nesting
		if (depth === 0) return index + 1
	}
	return tokens.length
}

/**
 * Tags every top-level block with an id unique to this page, and remembers
 * each one's line map and tokens - the one point where markdown-it's own view
 * of the note's structure is still in hand, before `tiptap-markdown` turns it
 * into HTML and every source position is lost.
 */
function captureSourceBlocks(md: MarkdownIt) {
	return (state: StateCore) => {
		const blocks: CapturedBlock[] = []
		const lines = state.src.split('\n')
		for (const token of state.tokens) {
			if (token.type === 'hr' && token.map) {
				token.attrSet(RULE_TEXT_ATTRIBUTE, lines[token.map[0]].trim())
			}
			if (token.type === 'list_item_open' && token.map) {
				const written = WRITTEN_LIST_MARKER.exec(lines[token.map[0]])
				if (written) token.attrSet(LIST_MARKER_ATTRIBUTE, written[1])
			}
		}

		let index = 0
		while (index < state.tokens.length) {
			const token = state.tokens[index]
			const end = blockEnd(state.tokens, index)
			if (token.level === 0 && token.map) {
				const id = nextSourceId++
				blocks.push({
					id,
					map: [token.map[0], token.map[1]],
					structure: describeStructure(state.tokens.slice(index, end)),
				})
				token.attrSet(SOURCE_ID_ATTRIBUTE, String(id))
			}
			index = end
		}
		captures.set(md, blocks)
	}
}

/** Registers the capture on `md`; safe to call on every parse, as `tiptap-markdown` does its setup hooks. */
export function installSourceBlockCapture(md: MarkdownIt): void {
	if (installed.has(md)) return
	installed.add(md)
	md.core.ruler.push('source_blocks', captureSourceBlocks(md))
}

/** The blocks of the last note `md` parsed, consumed so a later parse cannot be mistaken for it. */
export function takeCapturedBlocks(md: MarkdownIt): CapturedBlock[] {
	const blocks = captures.get(md) ?? []
	captures.delete(md)
	return blocks
}

/** An id no parsed block has, for a block made up after parsing. */
export function newSourceId(): number {
	return nextSourceId++
}
