import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { BLOCKQUOTE_MARKER } from '@/editor/extensions/blockquote/blockquote-marker'
import { blockquoteMarkerLength } from '@/editor/extensions/blockquote/blockquote-marker'
import {
	headingMarkerLength,
	headingMarkerText,
	parseHeadingLevel,
} from '@/editor/extensions/heading/heading-marker'
import {
	bulletMarkerText,
	orderedMarkerText,
	parseListMarker,
	taskMarkerText,
} from '@/editor/extensions/list/list-marker'

/**
 * A heading's `#`x`level`. `parseHeadingLevel` already answers `1` for text
 * with no marker, so resolving is the same expression whether one is present
 * or not - present markers resolve to themselves, absent ones to `# `.
 */
const headingMarkerSpec: BlockMarkerSpec = {
	nodeTypes: ['heading'],
	markerHost: 'self',
	revealScope: 'node',
	length: headingMarkerLength,
	resolve: ({ text }) => headingMarkerText(parseHeadingLevel(text)),
}

/**
 * A blockquote's `"> "`, on its own first line only - a multi-paragraph or
 * nested quote keeps every other level synthesized at save time (see
 * `blockquote-markdown-spec.ts`).
 */
export const blockquoteMarkerSpec: BlockMarkerSpec = {
	nodeTypes: ['blockquote'],
	markerHost: 'firstParagraph',
	revealScope: 'marker',
	length: blockquoteMarkerLength,
	resolve: () => BLOCKQUOTE_MARKER,
	exit: (editor) => editor.chain().lift('blockquote').run(),
}

/**
 * A list item's bullet, number or checkbox. Kind comes from the item's own
 * node type and its immediate parent list, never from re-reading the marker:
 * retyping a bullet's `-` as `1.` does not change what the item structurally
 * is. Only an ordered item's *number* is corrected, never its delimiter style
 * or a bullet's character - those stay whatever the author chose.
 */
export const listMarkerSpec: BlockMarkerSpec = {
	nodeTypes: ['listItem', 'taskItem'],
	markerHost: 'firstParagraph',
	revealScope: 'marker',
	length: (text) => parseListMarker(text)?.markerLength ?? 0,
	resolve: ({ node, parent, index, text }) => {
		const parsed = parseListMarker(text)

		if (node.type.name === 'taskItem') {
			return parsed?.kind === 'task'
				? text.slice(0, parsed.markerLength)
				: taskMarkerText(Boolean(node.attrs.checked))
		}

		if (parent?.type.name === 'orderedList') {
			const expected = (parent.attrs.start ?? 1) + index
			return parsed?.kind === 'ordered' && parsed.number === expected
				? text.slice(0, parsed.markerLength)
				: orderedMarkerText(expected)
		}

		return parsed?.kind === 'bullet'
			? text.slice(0, parsed.markerLength)
			: bulletMarkerText()
	},
	exit: (editor, nodeTypeName) =>
		editor.chain().liftListItem(nodeTypeName).run(),
}

/** Every block construct whose syntax is real leading text. */
export const BLOCK_MARKER_SPECS: BlockMarkerSpec[] = [
	headingMarkerSpec,
	blockquoteMarkerSpec,
	listMarkerSpec,
]
