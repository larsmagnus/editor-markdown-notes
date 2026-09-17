import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'

import { compareElementToDomPoint } from '#src/editor/extensions/focus-navigation/focusable-elements'
import type { FocusDirection } from '#src/editor/extensions/focus-navigation/focusable-elements'

/** The DOM point right after/before `element` among its own siblings - so a
 *  widget's own next button (frontmatter's "Delete" after "Copy") isn't
 *  mistaken for being past the whole widget. */
export function domPointAdjacentTo(
	element: Element,
	direction: FocusDirection
): { node: Node; offset: number } {
	const parent = element.parentNode
	if (!parent) return { node: element, offset: 0 }

	const index = Array.prototype.indexOf.call(parent.childNodes, element)
	return { node: parent, offset: direction === 1 ? index + 1 : index }
}

/** The document position just past/before whichever ProseMirror node
 *  `element` belongs to - the far side of the widget, not just the next
 *  sibling button. `posAtDOM` + `$pos.after/before` make this generic, with
 *  no per-node-type knowledge needed. */
export function nearestTextBoundary(
	editor: Editor,
	element: Element,
	direction: FocusDirection
): number {
	const pos = editor.view.posAtDOM(element, 0)
	const resolved = editor.state.doc.resolve(pos)
	return direction === 1
		? resolved.after(resolved.depth)
		: resolved.before(resolved.depth)
}

/** The nearest valid text position at or past `pos`, or `null` if `pos`
 *  already sits at that edge of the document. `pos` itself is often
 *  already valid - e.g. right after a leading widget's node closes - and
 *  that counts as the candidate, not "nothing found". */
export function nearestTextPosition(
	editor: Editor,
	pos: number,
	direction: FocusDirection
): number | null {
	const { doc } = editor.state
	const clampedPos = Math.max(0, Math.min(pos, doc.content.size))

	if (direction === 1 && clampedPos >= doc.content.size) return null
	if (direction === -1 && clampedPos <= 0) return null

	return TextSelection.near(doc.resolve(clampedPos), direction).from
}

export function buttonComesFirst(
	editor: Editor,
	button: HTMLElement,
	textPos: number,
	direction: FocusDirection
): boolean {
	const textDomPoint = editor.view.domAtPos(textPos)
	const position = compareElementToDomPoint(button, textDomPoint)
	return direction === 1 ? position < 0 : position > 0
}
