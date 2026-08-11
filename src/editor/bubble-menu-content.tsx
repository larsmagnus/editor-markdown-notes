'use client'

import { useCurrentEditor, useEditorState } from '@tiptap/react'

import { ImageBubbleControls } from '@/editor/image/bubble-controls'
import { TextBubbleControls } from '@/editor/text-bubble-controls'

/**
 * Dispatches to the bubble menu's contextual controls, separate from the
 * bubble that positions them. `BubbleMenu` measures the DOM through
 * floating-ui, which happy-dom cannot do, so this split is what makes the
 * controls testable at all.
 *
 * Branches on the active selection so image and text controls never render
 * at once. A third contextual case should become a lookup table (the same
 * data-table convention `text-style-commands.ts` uses) rather than another
 * `if`. Reads `isActive` through `useEditorState` rather than off `editor`
 * directly - `useEditor`'s default options don't re-render on transactions,
 * so a plain `editor.isActive('image')` would only ever reflect the
 * selection at mount and never update as the user clicks around.
 */
export function BubbleMenuContent() {
	const { editor } = useCurrentEditor()
	const isImageActive = useEditorState({
		editor,
		selector: ({ editor }) => editor?.isActive('image') ?? false,
	})

	if (isImageActive) {
		return <ImageBubbleControls />
	}

	return <TextBubbleControls />
}
