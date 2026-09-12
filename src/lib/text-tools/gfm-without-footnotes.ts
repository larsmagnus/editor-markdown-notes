import { gfmAutolinkLiteralFromMarkdown } from 'mdast-util-gfm-autolink-literal'
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { gfmTaskListItemFromMarkdown } from 'mdast-util-gfm-task-list-item'
import { gfmAutolinkLiteral } from 'micromark-extension-gfm-autolink-literal'
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item'
import { combineExtensions } from 'micromark-util-combine-extensions'

/**
 * The GFM subset `document-text.ts`'s ProseMirror walk can also see, minus
 * footnotes - assembled from `micromark-extension-gfm`/`mdast-util-gfm`'s own
 * individual pieces rather than their bundled `gfm()`/`gfmFromMarkdown()`,
 * which both include footnote support unconditionally.
 *
 * `tiptap-markdown` has no footnote extension registered, so a live document
 * never turns `[^ref]` into a real node - it stays literal bracket text, and
 * `analysis-parity.test.ts` is the guard that this walk keeps agreeing with
 * that. Parsing footnotes here anyway would turn the same syntax into a
 * `footnoteReference`/`footnoteDefinition` node, substituted or restructured
 * differently than the PM side's literal text - a text-length mismatch that
 * throws every later offset in the same note out of step between the two
 * views.
 */
export const GFM_MICROMARK_EXTENSION = combineExtensions([
	gfmAutolinkLiteral(),
	gfmStrikethrough(),
	gfmTable(),
	gfmTaskListItem(),
])

export const GFM_MDAST_EXTENSIONS = [
	gfmAutolinkLiteralFromMarkdown(),
	gfmStrikethroughFromMarkdown(),
	gfmTableFromMarkdown(),
	gfmTaskListItemFromMarkdown(),
]
