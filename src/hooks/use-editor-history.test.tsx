import { act, renderHook } from '@testing-library/react'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { useEditorHistory } from '@/hooks/use-editor-history'
import { createEditor } from '@/test-utils/editor'

describe('history', () => {
	it('undoes and redoes an edit', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
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
