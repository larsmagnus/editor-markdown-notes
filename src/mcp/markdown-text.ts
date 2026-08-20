import type { Nodes, PhrasingContent, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'

import { splitFrontmatter } from '@/lib/frontmatter'
import type { ProseExclusion } from '@/lib/text-tools/prose-policy'
import {
	BLOCK_SEPARATOR,
	PROSE_SUBSTITUTE,
} from '@/lib/text-tools/prose-policy'
import { frontmatterRuns } from '@/mcp/frontmatter-prose'
import type { ProseSlice, SourcePosition } from '@/mcp/source-position'
import { alignedSlices, positionMapper } from '@/mcp/source-position'

/**
 * Flattens a markdown file into the plain text retext analyses, keeping enough
 * of a trail to turn the offsets it reports back into positions in the file.
 *
 * The mdast counterpart of `document-text.ts`, which does the same for the
 * editor's ProseMirror document. The two cannot share a walk - the editor's
 * schema needs React node views, which this process cannot load - so they share
 * `prose-policy.ts` instead, and `prose-parity.test.ts` proves they agree.
 */

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
 * Nodes holding inline content directly, and so the ones a blank line goes
 * before. Everything else with children is a container the walk descends
 * through; everything else without them is not prose and is skipped.
 */
const TEXT_BLOCKS = new Set(['paragraph', 'heading', 'tableCell'])

export type MarkdownProse = {
	text: string
	/**
	 * Where an offset into `text` sits in the original markdown, as 1-based
	 * line and column - what an agent needs to find the line, and the reason
	 * this exists at all. Pipeline offsets are meaningless outside this module.
	 */
	positionAt: (offset: number) => SourcePosition
}

export function markdownProse(markdown: string): MarkdownProse {
	// Split first: `body` is what mdast parses and what node offsets index into,
	// so the walk below needs it to read a node's raw source back out.
	const { frontmatter, body } = splitFrontmatter(markdown)
	const slices: ProseSlice[] = []
	let text = ''

	const startBlock = () => {
		if (text) text += BLOCK_SEPARATOR
	}

	const appendInline = (nodes: readonly PhrasingContent[], base: number) => {
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
							text.length,
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
				appendInline(node.children, base)
				continue
			}

			text += PROSE_SUBSTITUTE.atomInline
		}
	}

	const walk = (node: Nodes | RootContent, base: number) => {
		if (TEXT_BLOCKS.has(node.type) && 'children' in node) {
			startBlock()
			appendInline(node.children as PhrasingContent[], base)
			return
		}

		if ('children' in node) {
			for (const child of node.children) walk(child, base)
		}
	}

	if (frontmatter !== null) {
		// The opening `---` is its own line, so the frontmatter's own text starts
		// after the first newline in the file.
		for (const run of frontmatterRuns(
			frontmatter,
			markdown.indexOf('\n') + 1
		)) {
			startBlock()
			slices.push({
				offset: text.length,
				length: run.text.length,
				source: run.source,
			})
			text += run.text
		}
	}

	const tree = fromMarkdown(body, {
		extensions: [gfm()],
		mdastExtensions: [gfmFromMarkdown()],
	})
	walk(tree, markdown.length - body.length)

	return { text, positionAt: positionMapper(markdown, slices) }
}
