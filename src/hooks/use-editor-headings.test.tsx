import { act, renderHook } from '@testing-library/react'
import { Editor, EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { useEditorHeadings } from '@/hooks/use-editor-headings'

describe('headings', () => {
	it('toggles each heading level', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorHeadings(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleHeading(1))
		expect(editor.getHTML()).toContain('<h1>')
		expect(result.current.hasHeading(1)).toBe(true)

		act(() => result.current.toggleHeading(2))
		expect(editor.getHTML()).toContain('<h2>')

		act(() => result.current.toggleHeading(3))
		expect(editor.getHTML()).toContain('<h3>')

		act(() => result.current.toggleHeading(4))
		expect(editor.getHTML()).toContain('<h4>')

		act(() => result.current.toggleHeading(5))
		expect(editor.getHTML()).toContain('<h5>')

		act(() => result.current.toggleHeading(6))
		expect(editor.getHTML()).toContain('<h6>')
	})
})
