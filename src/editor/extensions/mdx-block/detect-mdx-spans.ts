import { Parser } from 'acorn'
import acornJsx from 'acorn-jsx'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'

const ACORN = Parser.extend(acornJsx())

const MDX_BLOCK_TYPES = new Set([
	'mdxjsEsm',
	'mdxJsxFlowElement',
	'mdxFlowExpression',
])

export type MdxSpan = { start: number; end: number; raw: string }

/**
 * Every top-level construct in `source` that markdown-it has no grammar for -
 * `import`/`export` statements, JSX elements, and `{expression}`
 * interpolation at the block level - with the exact byte range each occupies.
 *
 * Only root-level children are considered: an expression or JSX element
 * nested inside a paragraph (`some text {x}`) stays inline content there,
 * matching how mdast itself keeps it out of the block-level tree - the
 * inline case is a known, separate gap this pass does not close.
 *
 * A half-typed construct (an unclosed tag, an incomplete import) throws
 * rather than parsing partially, and this runs on every incoming change -
 * including a debounced sync from the still-mounted raw view, not just a
 * deliberate save - so a mid-edit document is a normal input here, not an
 * exceptional one. Answering it with no spans found leaves that text to
 * fall through to the same HTML-drop handling unparseable syntax already
 * has, rather than crashing the sync this runs inside.
 */
export function detectMdxSpans(source: string): MdxSpan[] {
	let tree: ReturnType<typeof fromMarkdown>
	try {
		tree = fromMarkdown(source, {
			extensions: [mdxjs({ acorn: ACORN, addResult: false })],
			mdastExtensions: [mdxFromMarkdown()],
		})
	} catch {
		return []
	}

	const spans: MdxSpan[] = []

	for (const node of tree.children) {
		if (!MDX_BLOCK_TYPES.has(node.type)) continue

		const start = node.position?.start.offset
		const end = node.position?.end.offset
		if (start === undefined || end === undefined) continue

		spans.push({ start, end, raw: source.slice(start, end) })
	}

	return spans
}
