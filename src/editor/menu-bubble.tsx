'use client'

import { BubbleMenu, useCurrentEditor } from '@tiptap/react'

import { BubbleMenuContent } from '@/editor/bubble-menu-content'

/**
 * A contextual menu that is only visible
 * when selecting text
 */
export function MenuBubble() {
	const { editor } = useCurrentEditor()

	if (!editor) {
		return null
	}

	return (
		<BubbleMenu
			editor={editor}
			tippyOptions={{
				duration: 50,
			}}
		>
			<BubbleMenuContent />
		</BubbleMenu>
	)
}
