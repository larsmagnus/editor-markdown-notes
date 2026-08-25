import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'
import { toggleDelimitedMark } from '@/editor/extensions/formatting/toggle-delimited-mark'

describe('toggleDelimitedMark', () => {
	it('wraps an unmarked selection', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello world</p>')
		editor.commands.setTextSelection({ from: 7, to: 12 })

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('unwraps a selection that exactly matches an existing run', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		// The run ("**world**") spans 7-16.
		editor.commands.setTextSelection({ from: 7, to: 16 })

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world there'
		)
	})

	it('unwraps a selection contained within a larger run', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p><strong>**hello world**</strong></p>')
		// Selecting just "world" inside the larger bold run still unwraps the
		// whole run - there is only ever one pair of delimiters per run.
		editor.commands.setTextSelection({ from: 9, to: 14 })

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world'
		)
	})

	it('declines on an empty selection', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello world</p>')
		editor.commands.setTextSelection(7)

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	// Regression: `findMarkRuns` stops extending a run at any non-text node, so
	// a selection spanning two bold runs split by a hard break has the mark on
	// every text node it touches but matches no single run - this used to be
	// misread as "fully marked" and unwrapped as if it were one run.
	it('declines on a selection spanning two runs split by a non-text inline node', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<p><strong>**bold </strong><br><strong> text**</strong></p>'
		)
		editor.commands.setTextSelection({
			from: 1,
			to: editor.state.doc.content.size - 1,
		})

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('declines on a selection that only partially overlaps a run', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')
		// Selection starts inside "hello " (plain) and ends inside the bold run.
		editor.commands.setTextSelection({ from: 5, to: 11 })

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})
})
