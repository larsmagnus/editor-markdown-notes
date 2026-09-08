import { act, renderHook } from '@testing-library/react'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { useEditorColor } from '@/hooks/use-editor-color'
import { createEditor } from '@/test-utils/editor'

describe('colour', () => {
	it('sets and clears the colour of the selection', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorColor(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleTextColor('#fb2c36'))
		expect(result.current.hasTextColor('#fb2c36')).toBe(true)

		act(() => result.current.toggleTextColor('#fb2c36'))
		expect(result.current.hasTextColor('#fb2c36')).toBe(false)
	})
})
