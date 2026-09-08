import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import { toggleDelimitedMark } from '#src/editor/extensions/formatting/toggle-delimited-mark'
import { createEditor } from '#src/test-utils/editor'

describe('toggleDelimitedMark', () => {
	it('wraps an unmarked selection', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
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
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
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
		const editor = createEditor('<p><strong>**hello world**</strong></p>', {
			extensions: [StarterKit],
		})
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

	// The caret lands between the two delimiters, which is what makes the text
	// typed next land inside the run rather than after it.
	it('puts down an empty pair at a bare caret', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(7)

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello ****world'
		)
		expect(editor.state.selection.from).toBe(9)
	})

	it('takes the pair back out when toggled again inside it', () => {
		const editor = createEditor('<p>hello <strong>****</strong>world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(9)

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

	// `findMarkRuns` stops extending a run at any non-text node, so a selection
	// spanning two bold runs split by a hard break matches no single run. It is
	// still bold end to end, so toggling has to turn it off - both runs at once.
	it('unwraps every run in a selection split by a non-text inline node', () => {
		const editor = createEditor(
			'<p><strong>**bold </strong><br><strong> text**</strong></p>',
			{ extensions: [StarterKit] }
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

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'bold  text'
		)
	})

	it('declines on a selection that only partially overlaps a run', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		// Selection starts inside "hello " (plain) and ends inside the bold run.
		editor.commands.setTextSelection({ from: 5, to: 11 })

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('absorbs a fully-contained run rather than nesting a second pair around it', () => {
		const editor = createEditor('<p>plain <strong>**bold**</strong> more</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({
			from: 1,
			to: editor.state.doc.content.size - 1,
		})

		const applied = toggleDelimitedMark(
			editor.schema.marks.bold,
			fixedDelimiter('**'),
			{ open: '**', close: '**' }
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'**plain bold more**'
		)
		editor.destroy()
	})
})
