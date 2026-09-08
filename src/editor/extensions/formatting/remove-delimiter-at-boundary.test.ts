import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'
import {
	removeDelimiterOnBackspace,
	removeDelimiterOnDelete,
} from '@/editor/extensions/formatting/remove-delimiter-at-boundary'
import { createEditor } from '@/test-utils/editor'

describe('removeDelimiterOnBackspace', () => {
	it('unwraps the run from inside its opening delimiter', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		// The run ("**world**") spans 7-16; right after its opening "**" is 9.
		editor.commands.setTextSelection(9)

		const applied = removeDelimiterOnBackspace(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world there'
		)
		expect(
			editor.state.doc.rangeHasMark(
				1,
				editor.state.doc.content.size,
				editor.schema.marks.bold
			)
		).toBe(false)
		editor.destroy()
	})

	// The gesture that reads as "stop this being bold": caret at the very end of
	// the run, backspacing at the last character of its closing delimiter. Bound
	// to the opening delimiter alone, this fell through to native deletion, which
	// half-ate the closing "**" - and repair then put it straight back.
	it('unwraps the run from inside its closing delimiter', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		editor.commands.setTextSelection(16)

		const applied = removeDelimiterOnBackspace(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world there'
		)
		expect(
			editor.state.doc.rangeHasMark(
				1,
				editor.state.doc.content.size,
				editor.schema.marks.bold
			)
		).toBe(false)
		editor.destroy()
	})

	it('declines in the middle of a run', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		editor.commands.setTextSelection(11)

		const applied = removeDelimiterOnBackspace(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
		editor.destroy()
	})

	it('declines with a non-empty selection', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		editor.commands.setTextSelection({ from: 9, to: 11 })

		const applied = removeDelimiterOnBackspace(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
		editor.destroy()
	})
})

describe('removeDelimiterOnDelete', () => {
	it('unwraps the run from inside its closing delimiter', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		// The run ("**world**") ends at 16; right before its closing "**" is 14.
		editor.commands.setTextSelection(14)

		const applied = removeDelimiterOnDelete(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world there'
		)
		editor.destroy()
	})

	it('unwraps the run from inside its opening delimiter', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		editor.commands.setTextSelection(7)

		const applied = removeDelimiterOnDelete(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(true)
		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello world there'
		)
		editor.destroy()
	})

	it('declines in the middle of a run', () => {
		const editor = createEditor(
			'<p>hello <strong>**world**</strong> there</p>',
			{ extensions: [StarterKit] }
		)
		editor.commands.setTextSelection(11)

		const applied = removeDelimiterOnDelete(
			editor.schema.marks.bold,
			fixedDelimiter('**')
		)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
		editor.destroy()
	})
})
