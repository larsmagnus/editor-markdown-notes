import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import {
	removeClosingDelimiterOnDelete,
	removeOpeningDelimiterOnBackspace,
} from '@/editor/extensions/formatting/remove-delimiter-at-boundary'

describe('removeOpeningDelimiterOnBackspace', () => {
	it('removes the opening delimiter and strips the mark', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		// The run ("**world**") starts at 7; right after its opening "**" is 9.
		editor.commands.setTextSelection(9)

		const applied = removeOpeningDelimiterOnBackspace(
			editor.schema.marks.bold,
			2
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world** there'
		)
		expect(
			editor.state.doc.rangeHasMark(
				1,
				editor.state.doc.content.size,
				editor.schema.marks.bold
			)
		).toBe(false)
	})

	it('declines when the caret is not at a run start', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		editor.commands.setTextSelection(11)

		const applied = removeOpeningDelimiterOnBackspace(
			editor.schema.marks.bold,
			2
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('declines with a non-empty selection', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		editor.commands.setTextSelection({ from: 9, to: 11 })

		const applied = removeOpeningDelimiterOnBackspace(
			editor.schema.marks.bold,
			2
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})
})

describe('removeClosingDelimiterOnDelete', () => {
	it('removes the closing delimiter and strips the mark', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		// The run ("**world**") ends at 16; right before its closing "**" is 14.
		editor.commands.setTextSelection(14)

		const applied = removeClosingDelimiterOnDelete(editor.schema.marks.bold, 2)(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world there'
		)
	})

	it('declines when the caret is not at a run end', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		editor.commands.setTextSelection(11)

		const applied = removeClosingDelimiterOnDelete(editor.schema.marks.bold, 2)(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(false)
	})
})
