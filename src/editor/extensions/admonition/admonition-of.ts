import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { blockquoteMarkerLength } from '#src/editor/extensions/blockquote/blockquote-marker'
import {
	ADMONITION_TAG_PATTERN,
	parseAdmonitionType,
} from '#src/lib/admonition-tag'
import type { AdmonitionType } from '#src/lib/admonition-tag'

/** What a blockquote's first paragraph says about it being an admonition. */
type AdmonitionTag = {
	type: AdmonitionType
	/** Offset in the paragraph's text where `[!TYPE]` starts - just past the `> `. */
	tagStart: number
	tagLength: number
}

/**
 * The admonition a blockquote's first line declares, or `null` for a plain
 * quote. The line must be nothing but `> [!TYPE]`: GFM ignores a tag with
 * text after it on the same line, so treating one as an alert would draw
 * something GitHub does not.
 */
export function readAdmonition(
	blockquote: ProseMirrorNode
): AdmonitionTag | null {
	if (blockquote.type.name !== 'blockquote') return null

	const paragraph = blockquote.firstChild
	if (paragraph?.type.name !== 'paragraph') return null

	const text = paragraph.textContent
	const tagStart = blockquoteMarkerLength(text)
	if (tagStart === 0) return null

	const match = ADMONITION_TAG_PATTERN.exec(text.slice(tagStart))
	const type = match?.[1] ? parseAdmonitionType(match[1]) : null
	if (!match || !type) return null

	return {
		type,
		tagStart,
		tagLength: match[0].length,
	}
}
