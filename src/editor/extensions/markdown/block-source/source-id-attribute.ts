import type { GlobalAttributes } from '@tiptap/core'

import { SOURCE_ID_ATTRIBUTE } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'

/** Every node type a top-level block of a note can parse to. */
const TOP_LEVEL_TYPES = [
	'paragraph',
	'heading',
	'blockquote',
	'bulletList',
	'orderedList',
	'taskList',
	'codeBlock',
	'horizontalRule',
	'table',
	'frontmatter',
	'literalBlock',
	'htmlBlock',
]

/** The id markdown-it tagged a block with; a code block carries it on its inner `<code>`. */
function readSourceId(element: HTMLElement): number | null {
	const value =
		element.getAttribute(SOURCE_ID_ATTRIBUTE) ??
		element.querySelector(':scope > code')?.getAttribute(SOURCE_ID_ATTRIBUTE)
	return value ? Number(value) : null
}

/**
 * `sourceId`, on every node a top-level block can parse to. Never rendered,
 * and never carried onto the second half of a split.
 */
export function sourceIdAttribute(): GlobalAttributes[number] {
	return {
		types: TOP_LEVEL_TYPES,
		attributes: {
			sourceId: {
				default: null,
				rendered: false,
				keepOnSplit: false,
				parseHTML: readSourceId,
			},
		},
	}
}
