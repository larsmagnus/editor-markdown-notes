import { useCurrentEditor } from '@tiptap/react'

/** Undo and redo, with the queries the toolbar disables its buttons from. */
export function useEditorHistory() {
	const { editor } = useCurrentEditor()

	const undo = () => {
		editor?.chain().focus().undo().run()
	}

	const redo = () => {
		editor?.chain().focus().redo().run()
	}

	const canUndo = () => editor?.can().chain().focus().undo().run() ?? false
	const canRedo = () => editor?.can().chain().focus().redo().run() ?? false

	return { undo, redo, canUndo, canRedo }
}
