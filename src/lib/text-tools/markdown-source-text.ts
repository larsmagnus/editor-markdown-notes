import type { Nodes, PhrasingContent, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'

import { splitFrontmatter } from '#src/lib/host/frontmatter'
import { flattenInlineNodes } from '#src/lib/text-tools/flatten-inline-nodes'
import { frontmatterRuns } from '#src/lib/text-tools/frontmatter-prose'
import {
	GFM_MDAST_EXTENSIONS,
	GFM_MICROMARK_EXTENSION,
} from '#src/lib/text-tools/gfm-without-footnotes'
import { BLOCK_SEPARATOR } from '#src/lib/text-tools/prose-policy'
import type { SourceSlice } from '#src/lib/text-tools/source-offset'

/**
 * Flattens a markdown source string into the plain text retext analyses,
 * keeping enough of a trail to turn the offsets it reports back into
 * character offsets in that same source string.
 *
 * The mdast counterpart of `document-text.ts`, which does the same for the
 * editor's ProseMirror document. The two cannot share a walk - the editor's
 * schema needs React node views, which cannot be loaded outside the webview -
 * so they share `prose-policy.ts` instead, and `prose-parity.test.ts` proves
 * they agree. Used by both the raw editor (to place highlights in the
 * textarea) and the MCP server (`src/mcp/markdown-text.ts`, which layers a
 * line/column conversion on top for an agent to act on).
 */

/**
 * Nodes holding inline content directly, and so the ones a blank line goes
 * before. Everything else with children is a container the walk descends
 * through; everything else without them is not prose and is skipped.
 */
const TEXT_BLOCKS = new Set(['paragraph', 'heading', 'tableCell'])

export type MarkdownSourceText = {
	text: string
	slices: SourceSlice[]
}

export function getMarkdownSourceText(markdown: string): MarkdownSourceText {
	// Split first: `body` is what mdast parses and what node offsets index into,
	// so the walk below needs it to read a node's raw source back out.
	const { frontmatter, body } = splitFrontmatter(markdown)
	const slices: SourceSlice[] = []
	let text = ''

	const startBlock = () => {
		if (text) text += BLOCK_SEPARATOR
	}

	const walk = (node: Nodes | RootContent, base: number) => {
		if (TEXT_BLOCKS.has(node.type) && 'children' in node) {
			startBlock()
			const result = flattenInlineNodes(
				node.children as PhrasingContent[],
				body,
				base,
				text.length
			)
			text += result.text
			slices.push(...result.slices)
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
		extensions: [GFM_MICROMARK_EXTENSION],
		mdastExtensions: [GFM_MDAST_EXTENSIONS],
	})
	walk(tree, markdown.length - body.length)

	return { text, slices }
}
