import { Editor, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createEnsureDelimitersPlugin } from '@/editor/extensions/formatting/ensure-delimiters-plugin'

describe('createEnsureDelimitersPlugin', () => {
	it('wraps a bold run with no delimiter text at all', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(this.editor.schema.marks.bold, '**'),
						]
					},
				}),
			],
			content: '',
		})

		editor.commands.setContent('<p>hello <strong>world</strong></p>')

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('leaves an already-delimited run alone', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(this.editor.schema.marks.bold, '**'),
						]
					},
				}),
			],
			content: '',
		})

		editor.commands.setContent('<p>hello <strong>**world**</strong></p>')

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('fixes multiple broken runs in one transaction without corrupting later ones', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(this.editor.schema.marks.bold, '**'),
						]
					},
				}),
			],
			content: '',
		})

		editor.commands.setContent(
			'<p><strong>one</strong> plain <strong>two</strong></p>'
		)

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'**one** plain **two**'
		)
	})

	it('only adds the missing side when one delimiter is already present', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(this.editor.schema.marks.bold, '**'),
						]
					},
				}),
			],
			content: '',
		})

		editor.commands.setContent('<p><strong>**world</strong></p>')

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'**world**'
		)
	})

	// Regression: inserting the closing delimiter via `tr.insertText` inherited
	// the run's own mark by position, not by explicit intent - which happened
	// to work here, but relying on that inference (rather than passing the
	// mark explicitly) is exactly what let the round-trip escaping bug and the
	// unmarked-delimiter design both slip through undetected earlier.
	it("marks the delimiters it inserts with the run's own mark", () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(this.editor.schema.marks.bold, '**'),
						]
					},
				}),
			],
			content: '',
		})

		editor.commands.setContent('<p>hello <strong>world</strong></p>')

		const bold = editor.schema.marks.bold
		const size = editor.state.doc.content.size
		// "hello **world**" - the whole run, including its new delimiters, is
		// marked bold end to end.
		expect(editor.state.doc.rangeHasMark(7, size, bold)).toBe(true)
		expect(editor.state.doc.rangeHasMark(1, 7, bold)).toBe(false)
	})
})
