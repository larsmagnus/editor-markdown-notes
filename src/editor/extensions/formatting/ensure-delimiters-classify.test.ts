import { TextSelection } from '@tiptap/pm/state'
import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import {
	findAuthoredRemovals,
	isAbandonedEmptyPair,
	missingDelimiters,
} from '#src/editor/extensions/formatting/ensure-delimiters-classify'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import { createDeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'
import { createEditor } from '#src/test-utils/editor'

describe('missingDelimiters', () => {
	it('reports both sides missing for a run with no delimiter text at all', () => {
		const editor = createEditor('<p>hello <strong>world</strong></p>', {
			parseOnly: true,
		})
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!

		expect(
			missingDelimiters(editor.state.doc, fixedDelimiter('**'), run)
		).toEqual({
			open: '**',
			close: '**',
		})
	})

	it('returns null for an already-delimited run', () => {
		const editor = createEditor('<p>hello <strong>**world**</strong></p>')
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!

		expect(
			missingDelimiters(editor.state.doc, fixedDelimiter('**'), run)
		).toBeNull()
	})

	it('reports only the missing side when one delimiter is already present', () => {
		const editor = createEditor('<p><strong>**world</strong></p>', {
			parseOnly: true,
		})
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!

		expect(
			missingDelimiters(editor.state.doc, fixedDelimiter('**'), run)
		).toEqual({
			close: '**',
		})
	})
})

describe('isAbandonedEmptyPair', () => {
	it('is true for a bare delimiter pair the caret has left', () => {
		const editor = createEditor('<p><strong>****</strong>x</p>', {
			parseOnly: true,
		})
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!
		const selection = TextSelection.create(editor.state.doc, run.to + 1)

		expect(
			isAbandonedEmptyPair(
				editor.state.doc,
				fixedDelimiter('**'),
				run,
				selection
			)
		).toBe(true)
	})

	it('is false while the caret is still inside the pair', () => {
		const editor = createEditor('<p><strong>****</strong>x</p>', {
			parseOnly: true,
		})
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!
		const selection = TextSelection.create(editor.state.doc, run.from + 1)

		expect(
			isAbandonedEmptyPair(
				editor.state.doc,
				fixedDelimiter('**'),
				run,
				selection
			)
		).toBe(false)
	})

	it('is false for a run holding real text between its delimiters', () => {
		const editor = createEditor('<p><strong>**world**</strong></p>')
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!
		const selection = TextSelection.create(editor.state.doc, run.to + 1)

		expect(
			isAbandonedEmptyPair(
				editor.state.doc,
				fixedDelimiter('**'),
				run,
				selection
			)
		).toBe(false)
	})
})

describe('findAuthoredRemovals', () => {
	it('flags a run whose opening delimiter the author just deleted', () => {
		const editor = createEditor('<p><strong>**world**</strong></p>')
		const bold = editor.schema.marks.bold
		const run = findMarkRuns(editor.state.doc, bold)[0]!
		const oldDoc = editor.state.doc

		const tr = editor.state.tr.delete(run.from, run.from + 2)
		const removed = findAuthoredRemovals(
			oldDoc,
			bold,
			fixedDelimiter('**'),
			createDeletionProbe([tr])
		)

		expect(removed.has(tr.mapping.map(run.from, -1))).toBe(true)
	})

	it('leaves an untouched run out of the removal set', () => {
		const editor = createEditor(
			'<p><strong>**one**</strong> plain <strong>**two**</strong></p>'
		)
		const bold = editor.schema.marks.bold
		const [firstRun, secondRun] = findMarkRuns(editor.state.doc, bold)
		const oldDoc = editor.state.doc

		const tr = editor.state.tr.delete(firstRun!.from, firstRun!.from + 2)
		const removed = findAuthoredRemovals(
			oldDoc,
			bold,
			fixedDelimiter('**'),
			createDeletionProbe([tr])
		)

		expect(removed.has(secondRun!.from)).toBe(false)
	})
})
