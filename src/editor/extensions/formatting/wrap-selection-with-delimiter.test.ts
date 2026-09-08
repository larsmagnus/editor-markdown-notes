import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { wrapSelectionWithDelimiter } from '@/editor/extensions/formatting/wrap-selection-with-delimiter'
import { createEditor } from '@/test-utils/editor'

describe('wrapSelectionWithDelimiter', () => {
	it('wraps the selection in delimiter text and marks the whole thing', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		// "world" is at positions 7-12.
		editor.commands.setTextSelection({ from: 7, to: 12 })

		const applied = wrapSelectionWithDelimiter(editor.schema.marks.bold, {
			open: '**',
			close: '**',
		})(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('marks the delimiter text along with the interior', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({ from: 7, to: 12 })

		wrapSelectionWithDelimiter(editor.schema.marks.bold, {
			open: '**',
			close: '**',
		})(editor.state, editor.view.dispatch)

		// "hello **world**" - the whole run, "**world**", spans 7-16.
		expect(editor.state.doc.rangeHasMark(7, 16, editor.schema.marks.bold)).toBe(
			true
		)
	})

	it('does not extend the mark past the delimiters', () => {
		const editor = createEditor('<p>hello world there</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({ from: 7, to: 12 })

		wrapSelectionWithDelimiter(editor.schema.marks.bold, {
			open: '**',
			close: '**',
		})(editor.state, editor.view.dispatch)

		expect(editor.state.doc.rangeHasMark(1, 7, editor.schema.marks.bold)).toBe(
			false
		)
		expect(
			editor.state.doc.rangeHasMark(
				16,
				editor.state.doc.content.size,
				editor.schema.marks.bold
			)
		).toBe(false)
	})

	it('declines on an empty selection', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(7)

		const applied = wrapSelectionWithDelimiter(editor.schema.marks.bold, {
			open: '**',
			close: '**',
		})(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('supports asymmetric open/close delimiter text', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({ from: 7, to: 12 })

		wrapSelectionWithDelimiter(editor.schema.marks.code, {
			open: '`` ',
			close: ' ``',
		})(editor.state, editor.view.dispatch)

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello `` world ``'
		)
	})
})
