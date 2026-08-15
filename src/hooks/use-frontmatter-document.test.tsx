import { renderHook } from '@testing-library/react'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
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
})
