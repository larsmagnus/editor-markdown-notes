import type { Node as ProseMirrorNode } from 'prosemirror-model'

import type { ProseExclusion } from '@/lib/text-tools/prose-policy'
import {
	BLOCK_SEPARATOR,
	frontmatterLineOffsets,
	PROSE_SUBSTITUTE,
} from '@/lib/text-tools/prose-policy'

/**
 * Flattens a ProseMirror document into the plain text retext analyses, keeping
 * enough of a trail to turn the offsets it reports back into positions.
 */

/** A run of text and the document position its first character sits at. */
type TextSlice = {
	/** Offset of this run within the flattened text. */
	offset: number
	length: number
	/** Position of the run's first character in the ProseMirror document. */
	from: number
}

export type DocumentText = {
	text: string
	slices: TextSlice[]
}

/**
 * This document's own name for each excluded construct.
 *
 * Keyed by `ProseExclusion` so a construct added to the shared policy fails to
 * compile here until this walk handles it too. `atomInline` is empty because it
 * is the fallback for every inline node that carries no text of its own, and
 * `inlineCode` names a mark rather than a node.
 */
const PROSE_MIRROR_NAMES: Record<ProseExclusion, readonly string[]> = {
	// Code is not prose, and skipping the node also keeps mermaid sources
	// unlinted.
	codeBlock: ['codeBlock'],
	// An inline `code` span holds identifiers, commands and paths - `useEffect`,
	// `pnpm run build` - which no writing check has an opinion worth hearing
	// about, and which the speller would flag almost without exception.
	inlineCode: ['code'],
	hardBreak: ['hardBreak'],
	atomInline: [],
}

const IGNORED_NODES = new Set(PROSE_MIRROR_NAMES.codeBlock)
const IGNORED_MARKS = new Set(PROSE_MIRROR_NAMES.inlineCode)

/** What an inline node that carries no text of its own stands in as. */
const INLINE_PLACEHOLDER = new Map(
	PROSE_MIRROR_NAMES.hardBreak.map(
		(name) => [name, PROSE_SUBSTITUTE.hardBreak] as const
	)
)

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

	// `pos` is the frontmatter node itself; its content starts one inside, and
	// `offset` walks `textContent`, which - `content: 'text*'`, no marks - lines
	// up with document positions one-for-one.
	for (const { value, offset } of frontmatterLineOffsets(node.textContent)) {
		// Reuses the same "already have text" check the block separator uses
		// everywhere else, so a line joins the block before it exactly the way
		// the block itself joins whatever textblock came before it.
		if (result) result += BLOCK_SEPARATOR
		slices.push({
			offset: result.length,
			length: value.text.length,
			from: pos + 1 + offset + value.start,
		})
		result += value.text
	}

	return result
}

export function getDocumentText(doc: ProseMirrorNode): DocumentText {
	const slices: TextSlice[] = []
	let text = ''

	doc.descendants((node, pos) => {
		if (IGNORED_NODES.has(node.type.name)) return false
		if (!node.isTextblock) return true

		if (node.type.name === 'frontmatter') {
			text = appendFrontmatterLines(node, pos, text, slices)
			return false
		}

		if (text) text += BLOCK_SEPARATOR

		// Inline children are walked rather than using `textContent`, because a
		// paragraph split by marks holds several text nodes and only their own
		// positions place them correctly.
		node.forEach((child, childOffset) => {
			// Stood in for rather than dropped, for the same reason an image is:
			// `the `code` span` would otherwise reach retext as `the span`, and
			// text on either side of a bare `` `x` `` would weld into one word.
			if (child.marks.some((mark) => IGNORED_MARKS.has(mark.type.name))) {
				text += PROSE_SUBSTITUTE.inlineCode
				return
			}

			if (!child.isText || !child.text) {
				// An unmapped separator, so the text on either side of an image or a
				// hard break is not welded into one word. `line<br>second` would
				// otherwise reach retext as `linesecond`, which it counts as a single
				// long word and scores the sentence's readability against.
				if (child.isInline)
					text +=
						INLINE_PLACEHOLDER.get(child.type.name) ??
						PROSE_SUBSTITUTE.atomInline
				return
			}

			slices.push({
				offset: text.length,
				length: child.text.length,
				// `pos` is the textblock itself; its content starts one inside.
				from: pos + 1 + childOffset,
			})
			text += child.text
		})

		return false
	})

	return { text, slices }
}
