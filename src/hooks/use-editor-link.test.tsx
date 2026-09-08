import { act, renderHook } from '@testing-library/react'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { useEditorLink } from '#src/hooks/use-editor-link'
import { createEditor } from '#src/test-utils/editor'

describe('links', () => {
	it('sets the link, then reads it back off the selection', () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 10, to: 15 })
		const { result } = renderHook(() => useEditorLink(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.setUrl('https://example.com'))
		act(() => result.current.setLink())

		expect(editor.getHTML()).toContain('href="https://example.com"')
		expect(result.current.selectedLink()).toBe('https://example.com')

		act(() => result.current.unsetLink())

		expect(editor.getHTML()).not.toContain('href=')
	})

	it('ignores an empty URL', () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 10, to: 15 })
		const { result } = renderHook(() => useEditorLink(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.setUrl('   '))
		act(() => result.current.setLink())

		expect(editor.getHTML()).not.toContain('href=')
	})
})
