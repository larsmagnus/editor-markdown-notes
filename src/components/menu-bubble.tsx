'use client'

import { useCurrentEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

import { BubbleMenuContent } from '@/components/bubble-menu-content'

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
		<BubbleMenu editor={editor}>
			<BubbleMenuContent />
		</BubbleMenu>
	)
}
