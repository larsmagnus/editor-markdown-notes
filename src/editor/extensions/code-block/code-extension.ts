import CodeMark from '@tiptap/extension-code'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

import { PARSED_BY_MARKDOWN_IT } from '@/editor/extensions/markdown/mark-serializer'
import type { MarkSerializerSide } from '@/editor/extensions/markdown/mark-serializer'

/**
 * The default serializer fences code with one more backtick than the
 * longest run it finds inside, so `` ```mermaid `` (needing only one
 * backtick to stay unambiguous) comes back fenced with four. Use the
 * shortest fence not already present as a run in the content.
 */
function codeFenceLength(text: string): number {
	const runLengths = new Set(
		Array.from(text.matchAll(/`+/g), (m) => m[0].length)
	)
	let length = 1
	while (runLengths.has(length)) length++
	return length
}

function codeFence(node: ProseMirrorNode, side: -1 | 1): string {
	const text = node.isText ? (node.text ?? '') : ''
	if (!text.includes('`')) return '`'
	const fence = '`'.repeat(codeFenceLength(text))
	return side > 0 ? ' ' + fence : fence + ' '
}

/**
 * StarterKit's copy excludes every other mark (`excludes: '_'`), so a code
 * span inside a bold run drops the bold mark and re-serializes as two
 * separate bold runs around unstyled code. Letting marks coexist keeps one
 * continuous run - but registration order then decides nesting (schema
 * mark-rank, not source order), so this must come after any mark that
 * should wrap around it; see `extensions.ts`.
 */
export const CodeExtension = CodeMark.extend({
	excludes: '',
	addStorage: () => ({
		markdown: {
			serialize: {
				open: ((_state, _mark, parent, index) =>
					codeFence(parent.child(index), -1)) satisfies MarkSerializerSide,
				close: ((_state, _mark, parent, index) =>
					codeFence(parent.child(index - 1), 1)) satisfies MarkSerializerSide,
				escape: false,
			},
			parse: PARSED_BY_MARKDOWN_IT,
		},
	}),
})
