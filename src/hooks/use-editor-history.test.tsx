import { act, renderHook } from '@testing-library/react'
import { Editor, EditorContext } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { useEditorHistory } from '@/hooks/use-editor-history'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

describe('history', () => {
	it('undoes and redoes an edit', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		currentEditor = editor
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorHistory(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => {
			editor.chain().focus().toggleBold().run()
		})
		expect(editor.getHTML()).toContain('<strong>')

		act(() => result.current.undo())
		expect(editor.getHTML()).not.toContain('<strong>')

		act(() => result.current.redo())
		expect(editor.getHTML()).toContain('<strong>')
	})
})
