import { act, renderHook } from '@testing-library/react'
import { Editor, EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { useEditorStyles } from '@/hooks/use-editor-styles'

describe('toggleStyle', () => {
	it('toggles bold', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('bold'))

		expect(editor.getHTML()).toContain('<strong>notes</strong>')
	})

	it('toggles italic', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('italic'))

		expect(editor.getHTML()).toContain('<em>notes</em>')
	})

	it('toggles strike', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('strike'))

		expect(editor.getHTML()).toContain('<s>notes</s>')
	})

	it('toggles code', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('code'))

		expect(editor.getHTML()).toContain('<code>notes</code>')
	})

	it('toggles codeBlock', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('codeBlock'))

		expect(editor.getHTML()).toContain('<pre>')
	})

	it('toggles blockquote', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('blockquote'))

		expect(editor.getHTML()).toContain('<blockquote>')
	})

	it('turns a heading back into a paragraph', () => {
		const editor = new Editor({ extensions, content: '## Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('paragraph'))

		expect(editor.getHTML()).toContain('<p>Some notes</p>')
	})

	it('clears every mark and the heading level for "none"', () => {
		const editor = new Editor({ extensions, content: '## **Some notes**' })
		editor.commands.setTextSelection({ from: 1, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('none'))

		expect(editor.getHTML()).toContain('<p>Some notes</p>')
		expect(editor.getHTML()).not.toContain('<strong>')
	})

	it('toggles an ordered list', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('ordered'))

		expect(editor.getHTML()).toContain('<ol')
	})

	it('toggles an unordered list', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('unordered'))

		expect(editor.getHTML()).toContain('<ul')
	})
})

describe('hasStyle', () => {
	it('reports the marks and nodes active on the selection', () => {
		const editor = new Editor({
			extensions,
			content: '> **Some** _notes_ and `code`',
		})
		editor.commands.setTextSelection({ from: 2, to: 6 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		expect(result.current.hasStyle('bold')).toBe(true)
		expect(result.current.hasStyle('blockquote')).toBe(true)
		expect(result.current.hasStyle('italic')).toBe(false)
		expect(result.current.hasStyle('code')).toBe(false)
		expect(result.current.hasStyle('ordered')).toBe(false)
		expect(result.current.hasStyle('unordered')).toBe(false)
	})
})

describe('canToggleStyle', () => {
	/**
	 * A query must not mutate. Every other style asks `editor.can()`, but
	 * `blockquote` chained off the editor directly, so merely rendering a toolbar
	 * that disables its buttons wrapped the document in a blockquote.
	 */
	it('leaves the document untouched when asked about blockquote', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})
		const before = editor.getHTML()

		act(() => {
			result.current.canToggleStyle('blockquote')
		})

		expect(editor.getHTML()).toBe(before)
	})

	it('leaves the document untouched when asked about the other styles', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})
		const before = editor.getHTML()

		act(() => {
			result.current.canToggleStyle('bold')
			result.current.canToggleStyle('italic')
			result.current.canToggleStyle('strike')
			result.current.canToggleStyle('code')
		})

		expect(editor.getHTML()).toBe(before)
	})

	/**
	 * `paragraph` and `codeBlock` always apply, but the old switch had no case for
	 * either and fell off the end returning `undefined`. That reads as "cannot",
	 * so both buttons sat permanently disabled in the menu bar.
	 */
	it('allows the styles that cannot be queried', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		expect(result.current.canToggleStyle('paragraph')).toBe(true)
		expect(result.current.canToggleStyle('codeBlock')).toBe(true)
		expect(result.current.canToggleStyle('none')).toBe(true)
	})

	it('allows the list styles unconditionally', () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		expect(result.current.canToggleStyle('ordered')).toBe(true)
		expect(result.current.canToggleStyle('unordered')).toBe(true)
	})
})
