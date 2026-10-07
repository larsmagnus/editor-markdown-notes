import HardBreak from '@tiptap/extension-hard-break'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

const SOFT_BREAK_ATTRIBUTE = 'data-soft-break'

type SerializerState = MarkdownSerializerState & { inTable?: boolean }

/**
 * Writes a break back as it was read: a soft one as the plain newline it was,
 * a hard one as `\` and a newline. Nothing is written for a break with nothing
 * after it, which markdown would not read as a break at all.
 */
function serializeBreak(
	state: SerializerState,
	node: ProseMirrorNode,
	parent: ProseMirrorNode,
	index: number
): void {
	for (let i = index + 1; i < parent.childCount; i++) {
		if (parent.child(i).type === node.type) continue
		if (state.inTable) state.write('<br>')
		else state.write(node.attrs.soft ? '\n' : '\\\n')
		return
	}
}

/**
 * A line break inside a paragraph, hard or soft. markdown-it would hand a
 * soft one - a newline in a hard-wrapped paragraph - back as a newline in
 * text, which collapses to a space, so editing a wrapped paragraph used to
 * join its lines. Kept as a break instead, it shows where the author broke
 * the line and saves back as the same plain newline.
 */
export const HardBreakExtension = HardBreak.extend({
	addAttributes() {
		return {
			soft: {
				default: false,
				parseHTML: (element: HTMLElement) =>
					element.hasAttribute(SOFT_BREAK_ATTRIBUTE),
				renderHTML: (attributes: { soft?: boolean }) =>
					attributes.soft ? { [SOFT_BREAK_ATTRIBUTE]: '' } : {},
			},
		}
	},

	addStorage() {
		return {
			markdown: {
				serialize: serializeBreak,
				parse: {
					setup(markdownit: {
						renderer: { rules: Record<string, () => string> }
					}) {
						markdownit.renderer.rules.softbreak = () =>
							`<br ${SOFT_BREAK_ATTRIBUTE}>`
					},
				},
			},
		}
	},
})
