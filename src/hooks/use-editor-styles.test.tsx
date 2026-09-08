import { act, renderHook } from '@testing-library/react'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { useEditorStyles } from '@/hooks/use-editor-styles'
import { createEditor } from '@/test-utils/editor'

describe('toggleStyle', () => {
	it('toggles bold', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('bold'))

		// The `**` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<strong>**notes**</strong>')
	})

	it('toggles italic', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('italic'))

		// The `_` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<em>_notes_</em>')
	})

	it('toggles strike', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('strike'))

		// The `~~` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<s>~~notes~~</s>')
	})

	it('toggles code', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('code'))

		// The backtick delimiters are real, marked text now (see
		// `formatting/inline-code/`), not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<code>`notes`</code>')
	})

	it('toggles codeBlock', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('## Some notes', { parseOnly: true })
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

	// Regression: only the selection's starting block had its `#`x`level`
	// marker stripped, leaving every heading after the first still reading
	// as literal marker text inside a `<p>`.
	it('turns every heading a multi-block selection spans back into a paragraph', () => {
		const editor = createEditor('# One\n\n## Two')
		editor.commands.setTextSelection({
			from: 0,
			to: editor.state.doc.content.size,
		})
		const { result } = renderHook(() => useEditorStyles(), {
			wrapper: ({ children }) => (
				<EditorContext.Provider value={{ editor }}>
					{children}
				</EditorContext.Provider>
			),
		})

		act(() => result.current.toggleStyle('paragraph'))

		expect(editor.getHTML()).toContain('<p>One</p>')
		expect(editor.getHTML()).toContain('<p>Two</p>')
	})

	it('toggles an ordered list', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('> **Some** _notes_ and `code`', {
			parseOnly: true,
		})
		// Positions shifted +2 from a bare "Some": the blockquote's own "> " is
		// now real leading text ahead of it (see `blockquote-marker.ts`).
		editor.commands.setTextSelection({ from: 4, to: 8 })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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
	})

	it('allows the list styles unconditionally', () => {
		const editor = createEditor('Some notes', { parseOnly: true })
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
