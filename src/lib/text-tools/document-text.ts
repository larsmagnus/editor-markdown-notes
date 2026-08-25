import type { Node as ProseMirrorNode } from 'prosemirror-model'

import { parseFrontmatterFence } from '@/editor/extensions/frontmatter/frontmatter-fence'
import { headingMarkerLength } from '@/editor/extensions/heading/heading-marker'
import { parseListMarker } from '@/editor/extensions/list/list-marker'
import {
	appendTextblockChildren,
	IGNORED_NODES,
} from '@/lib/text-tools/append-textblock-children'
import { delimiterRanges } from '@/lib/text-tools/delimiter-ranges'
import type { TextSlice } from '@/lib/text-tools/delimiter-ranges'
import {
	BLOCK_SEPARATOR,
	frontmatterLineOffsets,
} from '@/lib/text-tools/prose-policy'

/**
 * Flattens a ProseMirror document into the plain text retext analyses, keeping
 * enough of a trail to turn the offsets it reports back into positions.
 */

export type DocumentText = {
	text: string
	slices: TextSlice[]
}

/**
 * How much of `node`'s own leading text is markup, not prose - a heading's
 * `#`x`level`, or a list item's own bullet/ordered/task marker (real text
 * held by its *first paragraph*, `node` here, not the `listItem`/`taskItem`
 * wrapping it - that wrapper is never itself a textblock, so the walk below
 * never visits it directly).
 */
function leadingMarkerLength(
	node: ProseMirrorNode,
	parent: ProseMirrorNode | null,
	index: number
): number {
	if (node.type.name === 'heading') return headingMarkerLength(node.textContent)

	const inListItem =
		index === 0 &&
		(parent?.type.name === 'listItem' || parent?.type.name === 'taskItem')
	if (inListItem) return parseListMarker(node.textContent)?.markerLength ?? 0

	return 0
}

/**
 * Splits a frontmatter block into one "block" per YAML line rather than
 * reading its whole `\n`-joined text as one run.
 *
 * A `title:`/`description:` field can hold real prose worth checking, but
 * retext has no concept of YAML's line-based `key: value` structure - fed the
 * whole multi-line block as a single run, it finds no sentence-ending
 * punctuation between lines and scores five unrelated lines as one giant
 * run-on sentence. Splitting on `\n` first gives each line its own sentence
 * boundary instead, so a prose value still gets checked and a bare `status:
 * draft` line - with nothing retext would flag - stays quiet.
 *
 * The key itself is dropped along with its separator. Keys are identifiers, not
 * prose - `og_image`, `slug`, `draft` - and the speller would flag most of them
 * on every note in the workspace.
 */
function appendFrontmatterLines(
	node: ProseMirrorNode,
	pos: number,
	text: string,
	slices: TextSlice[]
): string {
	let result = text

	// The block's own `---` fence lines are real text in its content now (see
	// `frontmatter-fence.ts`), not just markup added at save time - stripped
	// here the same way `frontmatter-prose.ts` strips them on the MCP side, or
	// the fence lines themselves would reach retext as if they were YAML prose.
	const { codeFrom, codeTo } = parseFrontmatterFence(node.textContent)
	const yaml = node.textContent.slice(codeFrom, codeTo)

	// `pos` is the frontmatter node itself; its content starts one inside, then
	// `codeFrom` past the opening fence line, and `offset` walks `yaml`, which -
	// `content: 'text*'`, no marks - lines up with document positions one-for-one.
	for (const { value, offset } of frontmatterLineOffsets(yaml)) {
		// Reuses the same "already have text" check the block separator uses
		// everywhere else, so a line joins the block before it exactly the way
		// the block itself joins whatever textblock came before it.
		if (result) result += BLOCK_SEPARATOR
		slices.push({
			offset: result.length,
			length: value.text.length,
			from: pos + 1 + codeFrom + offset + value.start,
		})
		result += value.text
	}

	return result
}

export function getDocumentText(doc: ProseMirrorNode): DocumentText {
	const slices: TextSlice[] = []
	let text = ''
	const exclusions = delimiterRanges(doc)
	const cursor = { index: 0 }

	doc.descendants((node, pos, parent, index) => {
		if (IGNORED_NODES.has(node.type.name)) return false
		if (!node.isTextblock) return true

		if (node.type.name === 'frontmatter') {
			text = appendFrontmatterLines(node, pos, text, slices)
			return false
		}

		if (text) text += BLOCK_SEPARATOR

		text = appendTextblockChildren(
			node,
			pos,
			text,
			exclusions,
			cursor,
			slices,
			leadingMarkerLength(node, parent, index)
		)

		return false
	})

	return { text, slices }
}
