import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import type { ReactNode } from 'react'

import { extensions } from '@/editor/extensions'

/**
 * Storybook decorator target for components that call `useCurrentEditor()`
 * (`MenuBar`, `MenuBubble`) - they read `null` and render nothing without a
 * real `EditorContext.Provider` ancestor, same as `src/editor/editor.tsx`
 * provides in the app. Renders `EditorContent` so the view attaches to a
 * visible DOM node - `MenuBubble` positions itself off that via floating-ui,
 * and has nowhere to anchor to otherwise.
 */
export function EditorContextMount({ children }: { children: ReactNode }) {
	const editor = useEditor({
		extensions,
		content: '<p>Some sample text to format.</p>',
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
