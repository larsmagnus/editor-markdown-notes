import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

describe('italicDelimiterSpec', () => {
	it('reports a delimiter length of one', () => {
		expect(italicDelimiterSpec().length).toBe(1)
	})

	it('matches either italic marker', () => {
		const spec = italicDelimiterSpec()

		expect(spec.matches('_')).toBe(true)
		expect(spec.matches('*')).toBe(true)
		expect(spec.matches('~')).toBe(false)
	})

	it('resolves to the underscore marker for an isolated run', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							marks: [{ type: 'italic', attrs: { markup: '_' } }],
							text: 'truly',
						},
					],
				},
			],
		})

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		expect(runs).toHaveLength(1)
		const spec = italicDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('_')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('_')
	})

	it('falls back to an asterisk when the run sits mid-word', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'hello' },
						{
							type: 'text',
							marks: [{ type: 'italic', attrs: { markup: '_' } }],
							text: 'world',
						},
					],
				},
			],
		})

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		expect(runs).toHaveLength(1)
		const spec = italicDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('*')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('*')
	})
})
