import type { Node as ProseMirrorNode } from 'prosemirror-model'

import {
	appendProseText,
	delimiterRanges,
} from '#src/lib/text-tools/delimiter-ranges'
import type { TextSlice } from '#src/lib/text-tools/delimiter-ranges'
import type { ProseExclusion } from '#src/lib/text-tools/prose-policy'
import { PROSE_SUBSTITUTE } from '#src/lib/text-tools/prose-policy'

/**
 * `document-text.ts`'s own name for each excluded construct.
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

export const IGNORED_NODES = new Set(PROSE_MIRROR_NAMES.codeBlock)
const IGNORED_MARKS = new Set(PROSE_MIRROR_NAMES.inlineCode)

/** What an inline node that carries no text of its own stands in as. */
const INLINE_PLACEHOLDER = new Map(
	PROSE_MIRROR_NAMES.hardBreak.map(
		(name) => [name, PROSE_SUBSTITUTE.hardBreak] as const
	)
)

/**
 * Walks one textblock's inline children into `text` - separately from
 * `textContent`, because a paragraph split by marks holds several text nodes
 * and only their own positions place them correctly. `markerLength` drops a
 * heading's own leading `#`x`level` (real content now, see `heading-marker.ts`)
 * from what retext sees, the same way `document-text.ts`'s frontmatter handling
 * drops a frontmatter block's fence lines - markdown syntax is not prose.
 */
export function appendTextblockChildren(
	node: ProseMirrorNode,
	pos: number,
	text: string,
	exclusions: ReturnType<typeof delimiterRanges>,
	cursor: { index: number },
	slices: TextSlice[],
	markerLength = 0
): string {
	let result = text
	let remainingSkip = markerLength

	node.forEach((child, childOffset) => {
		// Stood in for rather than dropped, for the same reason an image is:
		// `the `code` span` would otherwise reach retext as `the span`, and
		// text on either side of a bare `` `x` `` would weld into one word.
		if (child.marks.some((mark) => IGNORED_MARKS.has(mark.type.name))) {
			result += PROSE_SUBSTITUTE.inlineCode
			return
		}

		if (!child.isText || !child.text) {
			// An unmapped separator, so the text on either side of an image or a
			// hard break is not welded into one word. `line<br>second` would
			// otherwise reach retext as `linesecond`, which it counts as a single
			// long word and scores the sentence's readability against.
			if (child.isInline)
				result +=
					INLINE_PLACEHOLDER.get(child.type.name) ?? PROSE_SUBSTITUTE.atomInline
			return
		}

		const skipped = Math.min(remainingSkip, child.text.length)
		remainingSkip -= skipped
		const visibleText = child.text.slice(skipped)
		if (!visibleText) return

		result = appendProseText(
			result,
			visibleText,
			// `pos` is the textblock itself; its content starts one inside.
			pos + 1 + childOffset + skipped,
			exclusions,
			cursor,
			slices
		)
	})

	return result
}
