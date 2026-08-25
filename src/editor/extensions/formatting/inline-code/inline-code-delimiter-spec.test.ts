import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

describe('inlineCodeDelimiterSpec', () => {
	it('detects a matching single-backtick fence at both ends', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('`x`')).toBe(1)
		expect(spec.detectClose('`x`')).toBe(1)
	})

	it('detects a longer matching fence at both ends', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('``x``')).toBe(2)
		expect(spec.detectClose('``x``')).toBe(2)
	})

	it('reports no delimiter when the text has no backticks at all', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('plain')).toBe(0)
		expect(spec.detectClose('plain')).toBe(0)
	})

	// Regression: code content that itself starts with a backtick run - e.g.
	// explaining fence syntax - used to be misread as an unfenced run missing
	// only its closing delimiter, so the repair only ever added a close fence
	// and never an open one.
	it('reports no delimiter when the leading and trailing backtick runs have different lengths', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('```mermaid')).toBe(0)
		expect(spec.detectClose('```mermaid')).toBe(0)
	})

	it('reports no delimiter when the whole text is one backtick run with nothing between', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('```')).toBe(0)
		expect(spec.detectClose('```')).toBe(0)
	})

	it('resolves a fresh pair of backticks for a run with no fence yet', () => {
		// `new Editor({ content })`'s initial parse never runs `ensure-
		// delimiters-plugin.ts` (only a later real transaction does - see
		// `delimiter-ranges.test.ts`'s regression on the same asymmetry), so
		// this run is still bare, unlike the same doc built via
		// `editor.commands.setContent(...)`.
		const editor = new Editor({
			extensions,
			content: {
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [
							{ type: 'text', marks: [{ type: 'code' }], text: 'helloWorld()' },
						],
					},
				],
			},
		})
		currentEditor = editor

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.code)
		expect(runs).toHaveLength(1)
		const spec = inlineCodeDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('`')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('`')
	})

	it('resolves a padded fence when the run itself contains a backtick', () => {
		const editor = new Editor({
			extensions,
			content: {
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [
							{ type: 'text', marks: [{ type: 'code' }], text: '```mermaid' },
						],
					},
				],
			},
		})
		currentEditor = editor

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.code)
		expect(runs).toHaveLength(1)
		const spec = inlineCodeDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('` ')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe(' `')
	})
})
