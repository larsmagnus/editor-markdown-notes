import { describe, expect, it } from 'vitest'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'
import { createEditor } from '@/test-utils/editor'

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

	// The empty pair `toggle-delimited-mark.ts` puts down at a bare caret. Read
	// as undelimited, it gets a second pair written around it and the author
	// types into `` ` `` ` `` instead of an empty code span; read as delimited,
	// it is also the shape `ensure-delimiters-plugin.ts` sweeps away when the
	// caret leaves without anything being typed.
	it('detects the empty pair as one backtick at each end', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('``')).toBe(1)
		expect(spec.detectClose('``')).toBe(1)
	})

	it('detects an empty pair written with a longer fence', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('````')).toBe(2)
		expect(spec.detectClose('````')).toBe(2)
	})

	it('reports no delimiter for a lone backtick, which cannot be a pair', () => {
		const spec = inlineCodeDelimiterSpec()

		expect(spec.detectOpen('`')).toBe(0)
		expect(spec.detectClose('`')).toBe(0)
	})

	it('resolves a fresh pair of backticks for a run with no fence yet', () => {
		// `createEditor(content, { parseOnly: true })`'s initial parse never runs `ensure-
		// delimiters-plugin.ts` (only a later real transaction does - see
		// `delimiter-ranges.test.ts`'s regression on the same asymmetry), so
		// this run is still bare, unlike the same doc built via
		// `editor.commands.setContent(...)`.
		const editor = createEditor(
			{
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
			{ parseOnly: true }
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.code)
		expect(runs).toHaveLength(1)
		const spec = inlineCodeDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('`')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('`')
	})

	it('resolves a padded fence when the run itself contains a backtick', () => {
		const editor = createEditor(
			{
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
			{ parseOnly: true }
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.code)
		expect(runs).toHaveLength(1)
		const spec = inlineCodeDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('` ')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe(' `')
	})
})
