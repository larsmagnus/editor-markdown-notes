import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { italicWrapMarkup } from '@/editor/extensions/italic/italic-wrap-markup'
import { createEditor } from '@/test-utils/editor'

describe('italicWrapMarkup', () => {
	it('always returns an asterisk when that is the preferred marker', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})

		expect(italicWrapMarkup(editor.state.doc, 7, 12, '*')).toBe('*')
	})

	it('uses the preferred underscore marker when neither edge is intraword', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		// "world" is at positions 7-12, preceded by a space.
		expect(italicWrapMarkup(editor.state.doc, 7, 12, '_')).toBe('_')
	})

	it('falls back to an asterisk when the character before the selection is a word character', () => {
		const editor = createEditor('<p>helloworld</p>', {
			extensions: [StarterKit],
		})
		// "world" starts right after "hello", with no space between.
		expect(italicWrapMarkup(editor.state.doc, 6, 11, '_')).toBe('*')
	})

	it('falls back to an asterisk when the character after the selection is a word character', () => {
		const editor = createEditor('<p>helloworld</p>', {
			extensions: [StarterKit],
		})
		// "hello" ends right before "world", with no space between.
		expect(italicWrapMarkup(editor.state.doc, 1, 6, '_')).toBe('*')
	})

	it('uses the underscore marker at the very start or end of the document', () => {
		const editor = createEditor('<p>hello</p>', { extensions: [StarterKit] })

		expect(italicWrapMarkup(editor.state.doc, 1, 6, '_')).toBe('_')
	})
})
