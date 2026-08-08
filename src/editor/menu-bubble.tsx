'use client'

import { BubbleMenu } from '@tiptap/react'

import { BubbleMenuContent } from '@/editor/bubble-menu-content'
import { useEditorTools } from '@/hooks/use-editor-tools'

/**
 * A contextual menu that is only visible
 * when selecting text
 */
export function MenuBubble() {
	const { editor } = useEditorTools()

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
