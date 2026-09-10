import { NodeSelection } from '@tiptap/pm/state'
import { useCurrentEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

import { BubbleMenuContent } from '#src/components/bubble-menu-content'

/**
 * A contextual menu that is only visible when selecting text. A `NodeSelection`
 * - an image, selected for keyboard navigation or deletion - has its own
 * overlay controls rendered in its node view, not this menu; without this
 * override the default `shouldShow` treats any non-empty selection as text and
 * shows text formatting controls floating over the selected image.
 */
export function MenuBubble() {
	const { editor } = useCurrentEditor()

	if (!editor) {
		return null
	}

	return (
		<BubbleMenu
			className="z-20"
			editor={editor}
			shouldShow={({ view, state }) =>
				view.hasFocus() &&
				!state.selection.empty &&
				!(state.selection instanceof NodeSelection)
			}
		>
			<BubbleMenuContent />
		</BubbleMenu>
	)
}
