import type { Editor } from '@tiptap/react'

/**
 * Frontmatter is always the document's first node, so there is nowhere for
 * Up/Left to go once the caret reaches its start - left to the default
 * keymap, ProseMirror's gap cursor still tries, landing a cursor above the
 * block with nothing rendered there to show for it. `endOfTextblock` (not a
 * plain position check) is what makes this correct for wrapped lines: it
 * asks the view whether the caret is on the first *visual* line, not just
 * at text offset 0.
 */
export function isAtFrontmatterEdge(
	editor: Editor,
	dir: 'up' | 'left'
): boolean {
	const { selection } = editor.state
	if (!selection.empty) return false
	if (selection.$from.parent.type.name !== 'frontmatter') return false
	return editor.view.endOfTextblock(dir)
}
