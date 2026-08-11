import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import type { ReactNode } from 'react'

import { extensions } from '@/editor/extensions'

interface EditorContextMountProps {
	children: ReactNode
	/** The note to mount, for the stories that need something specific in it. */
	content?: string
}

/**
 * Storybook decorator target for components that call `useCurrentEditor()`
 * (`MenuBar`, `MenuBubble`) - they read `null` and render nothing without a
 * real `EditorContext.Provider` ancestor, same as `src/editor/editor.tsx`
 * provides in the app. Renders `EditorContent` so the view attaches to a
 * visible DOM node - `MenuBubble` positions itself off that via floating-ui,
 * and has nowhere to anchor to otherwise.
 */
export function EditorContextMount({
	children,
	content = '<p>Some sample text to format.</p>',
}: EditorContextMountProps) {
	const editor = useEditor({
		extensions,
		content,
		autofocus: 'end',
	})

	if (!editor) return null

	return (
		<EditorContext.Provider value={{ editor }}>
			<EditorContent editor={editor} />
			{children}
		</EditorContext.Provider>
	)
}
