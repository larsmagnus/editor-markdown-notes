import { renderHook } from '@testing-library/react'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { useFrontmatterDocument } from '@/hooks/use-frontmatter-document'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

describe('useFrontmatterDocument', () => {
	it('rebuilds the document when the file changes underneath it', () => {
		const editor = new Editor({ extensions, content: 'Ship it.' })
		currentEditor = editor

		const { rerender } = renderHook(
			({ content }) => useFrontmatterDocument(editor, content),
			{ initialProps: { content: 'Ship it.' } }
		)

		rerender({ content: 'Someone else edited this.' })

		expect(editor.getText()).toBe('Someone else edited this.')
	})

	/**
	 * The autosave carries the editor's own text back as a new `content`, a
	 * debounce behind the keystrokes still arriving - so by the time it lands
	 * the document has moved on and no longer matches it. Rebuilding there would
	 * throw away everything typed since, and the caret with it.
	 */
	it('leaves the document alone when the change is its own save coming back', () => {
		const editor = new Editor({ extensions, content: 'Ship it.' })
		currentEditor = editor

		const { rerender } = renderHook(
			({ content }) =>
				useFrontmatterDocument(
					editor,
					content,
					(next) => next === 'Ship it. Today.'
				),
			{ initialProps: { content: 'Ship it.' } }
		)

		// The author kept typing while that save was in flight.
		editor.commands.setContent('<p>Ship it. Today. Really.</p>')

		rerender({ content: 'Ship it. Today.' })

		expect(editor.getText()).toBe('Ship it. Today. Really.')
	})

	/**
	 * The mount-time rebuild (inserting frontmatter into the initial content)
	 * stays excluded from history, or Ctrl+Z on an untouched document would
	 * clear it - see the first case below. Every later rebuild is a genuine
	 * external change, so it has to be undoable: left out of history, the
	 * existing stack would apply its steps to a document this rebuild had
	 * already swapped out from under them, corrupting rather than reverting.
	 */
	describe('undo across a rebuild', () => {
		it('is not itself undoable on the very first rebuild', () => {
			const editor = new Editor({ extensions, content: 'Ship it.' })
			currentEditor = editor

			renderHook(({ content }) => useFrontmatterDocument(editor, content), {
				initialProps: { content: '---\ntitle: Roadmap\n---\n\nShip it.' },
			})

			expect(editor.getText()).toContain('Ship it.')
			expect(editor.can().undo()).toBe(false)
		})

		it('undoes a later rebuild as one step, then the edit before it', async () => {
			const editor = new Editor({ extensions, content: 'Ship it.' })
			currentEditor = editor

			const { rerender } = renderHook(
				({ content }) => useFrontmatterDocument(editor, content),
				{ initialProps: { content: 'Ship it.' } }
			)

			editor.chain().focus('end').insertContent(' Today.').run()
			expect(editor.getText()).toBe('Ship it. Today.')

			// A real pause, not a scripting convenience: the edit and the rebuild
			// need to land in separate `prosemirror-history` groups (grouped by
			// wall-clock proximity, ~500ms) for undo to revert them one at a time
			// rather than as a single merged step - see editor-mode-live.test.tsx.
			await new Promise((resolve) => setTimeout(resolve, 600))

			// A change made outside this editor - someone edited the file directly.
			rerender({ content: 'Ship it. Today. Reviewed by the team.' })
			expect(editor.getText()).toBe('Ship it. Today. Reviewed by the team.')

			editor.commands.undo()
			expect(editor.getText()).toBe('Ship it. Today.')

			editor.commands.undo()
			expect(editor.getText()).toBe('Ship it.')
		})
	})
})
