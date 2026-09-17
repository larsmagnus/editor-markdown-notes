import {
	codeBlockMarkerSpec,
	frontmatterMarkerSpec,
} from '#src/editor/extensions/block-marker/fenced-specs'
import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'
import {
	liftOutOfConstruct,
	unwrapToParagraph,
} from '#src/editor/extensions/block-marker/unwrap'
import { BLOCKQUOTE_MARKER } from '#src/editor/extensions/blockquote/blockquote-marker'
import { blockquoteMarkerLength } from '#src/editor/extensions/blockquote/blockquote-marker'
import {
	demoteHeadingMarker,
	headingMarkerLength,
	headingMarkerText,
	parseHeadingLevel,
} from '#src/editor/extensions/heading/heading-marker'
import {
	HORIZONTAL_RULE_TEXT,
	horizontalRuleLength,
} from '#src/editor/extensions/horizontal-rule/horizontal-rule-marker'
import {
	parseListMarker,
	resolveListMarker,
} from '#src/editor/extensions/list/list-marker'

/**
 * A heading's `#`x`level`. `parseHeadingLevel` already answers `1` for text
 * with no marker, so resolving is the same expression whether one is present
 * or not - present markers resolve to themselves, absent ones to `# `.
 *
 * The only marker with a step down: Backspace against it lowers the level and
 * only takes the heading apart once there is no level left.
 */
const headingMarkerSpec: BlockMarkerSpec = {
	nodeTypes: ['heading'],
	markerHost: 'self',
	revealScope: 'node',
	backspaceRemovesMarker: true,
	length: headingMarkerLength,
	resolve: ({ text }) => headingMarkerText(parseHeadingLevel(text)),
	demote: demoteHeadingMarker,
	unwrap: unwrapToParagraph,
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
	backspaceRemovesMarker: true,
	length: blockquoteMarkerLength,
	resolve: () => BLOCKQUOTE_MARKER,
	demote: () => null,
	unwrap: liftOutOfConstruct,
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
	backspaceRemovesMarker: true,
	length: (text) => parseListMarker(text)?.markerLength ?? 0,
	resolve: ({ node, parent, index, text }) =>
		resolveListMarker(node, parent, index, text),
	demote: () => null,
	unwrap: liftOutOfConstruct,
}

/**
 * A horizontal rule, whose marker is its whole content - there is nothing to a
 * rule but its own syntax, so revealing it shows the node's entire text and
 * editing that text into something that is no longer a rule leaves a paragraph
 * holding whatever was typed.
 */
const horizontalRuleMarkerSpec: BlockMarkerSpec = {
	nodeTypes: ['horizontalRule'],
	markerHost: 'self',
	revealScope: 'node',
	unwrapWhenUnparseable: true,
	length: horizontalRuleLength,
	resolve: ({ text }) =>
		horizontalRuleLength(text) > 0 ? text : HORIZONTAL_RULE_TEXT,
	demote: () => null,
	unwrap: unwrapToParagraph,
}

/** Every block construct whose syntax is real text in the construct itself. */
export const BLOCK_MARKER_SPECS: BlockMarkerSpec[] = [
	headingMarkerSpec,
	blockquoteMarkerSpec,
	listMarkerSpec,
	codeBlockMarkerSpec,
	frontmatterMarkerSpec,
	horizontalRuleMarkerSpec,
]
