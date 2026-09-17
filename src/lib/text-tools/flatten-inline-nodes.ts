import type { PhrasingContent } from 'mdast'

import type { ProseExclusion } from '#src/lib/text-tools/prose-policy'
import { PROSE_SUBSTITUTE } from '#src/lib/text-tools/prose-policy'
import type { SourceSlice } from '#src/lib/text-tools/source-offset'
import { alignedSlices } from '#src/lib/text-tools/source-offset'

/**
 * This tree's own name for each excluded construct.
 *
 * Keyed by `ProseExclusion` so a construct added to the shared policy fails to
 * compile here until this walk handles it too. Block-level `code` and `html`
 * are dropped by being leaves the block walk never descends into; the names
 * listed here are what the *inline* walk matches against.
 */
const MDAST_TYPES: Record<ProseExclusion, readonly string[]> = {
	codeBlock: ['code'],
	inlineCode: ['inlineCode'],
	hardBreak: ['break'],
	atomInline: ['image', 'imageReference', 'html', 'footnoteReference'],
}

const INLINE_SUBSTITUTE = new Map(
	(Object.keys(MDAST_TYPES) as ProseExclusion[]).flatMap((exclusion) =>
		MDAST_TYPES[exclusion].map(
			(type) => [type, PROSE_SUBSTITUTE[exclusion]] as const
		)
	)
)

/**
 * Flattens one run of inline mdast nodes to plain text, alongside the slices
 * needed to trace an offset in that text back to `body`. `startOffset` is
 * where this run's text will land in the caller's larger string, since the
 * source-mapping slices are recorded against the whole document's text, not
 * this run's own.
 */
export function flattenInlineNodes(
	nodes: readonly PhrasingContent[],
	body: string,
	base: number,
	startOffset: number
): { text: string; slices: SourceSlice[] } {
	let text = ''
	const slices: SourceSlice[] = []

	for (const node of nodes) {
		const substitute = INLINE_SUBSTITUTE.get(node.type)
		if (substitute !== undefined) {
			text += substitute
			continue
		}

		if (node.type === 'text') {
			const start = node.position?.start.offset
			const end = node.position?.end.offset
			if (start !== undefined && end !== undefined) {
				// The raw source is handed over alongside the decoded value: an
				// escape or an entity makes the two different lengths, and only the
				// source says where each decoded character actually came from.
				slices.push(
					...alignedSlices(
						node.value,
						body.slice(start, end),
						startOffset + text.length,
						start + base
					)
				)
			}
			text += node.value
			continue
		}

		// Emphasis, strong, links and the like carry prose inside their own
		// markup - a link's text is prose, its URL is not, and the URL is not a
		// child so it drops out on its own.
		if ('children' in node) {
			const nested = flattenInlineNodes(
				node.children,
				body,
				base,
				startOffset + text.length
			)
			text += nested.text
			slices.push(...nested.slices)
			continue
		}

		text += PROSE_SUBSTITUTE.atomInline
	}

	return { text, slices }
}
