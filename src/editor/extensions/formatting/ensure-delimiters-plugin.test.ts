import { Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import { createEnsureDelimitersPlugin } from '#src/editor/extensions/formatting/ensure-delimiters-plugin'
import { createEditor } from '#src/test-utils/editor'

describe('createEnsureDelimitersPlugin', () => {
	it('wraps a bold run with no delimiter text at all', () => {
		const editor = createEditor('<p>hello <strong>world</strong></p>', {
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(
								this.editor.schema.marks.bold,
								fixedDelimiter('**')
							),
						]
					},
				}),
			],
		})

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('leaves an already-delimited run alone', () => {
		const editor = createEditor('<p>hello <strong>**world**</strong></p>', {
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(
								this.editor.schema.marks.bold,
								fixedDelimiter('**')
							),
						]
					},
				}),
			],
		})

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'hello **world**'
		)
	})

	it('fixes multiple broken runs in one transaction without corrupting later ones', () => {
		const editor = createEditor(
			'<p><strong>one</strong> plain <strong>two</strong></p>',
			{
				extensions: [
					StarterKit,
					Extension.create({
						name: 'ensureBoldDelimiters',
						addProseMirrorPlugins() {
							return [
								createEnsureDelimitersPlugin(
									this.editor.schema.marks.bold,
									fixedDelimiter('**')
								),
							]
						},
					}),
				],
			}
		)

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'**one** plain **two**'
		)
	})

	it('only adds the missing side when one delimiter is already present', () => {
		const editor = createEditor('<p><strong>**world</strong></p>', {
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(
								this.editor.schema.marks.bold,
								fixedDelimiter('**')
							),
						]
					},
				}),
			],
		})

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
		const editor = createEditor('<p>hello <strong>world</strong></p>', {
			extensions: [
				StarterKit,
				Extension.create({
					name: 'ensureBoldDelimiters',
					addProseMirrorPlugins() {
						return [
							createEnsureDelimitersPlugin(
								this.editor.schema.marks.bold,
								fixedDelimiter('**')
							),
						]
					},
				}),
			],
		})

		const bold = editor.schema.marks.bold
		const size = editor.state.doc.content.size
		// "hello **world**" - the whole run, including its new delimiters, is
		// marked bold end to end.
		expect(editor.state.doc.rangeHasMark(7, size, bold)).toBe(true)
		expect(editor.state.doc.rangeHasMark(1, 7, bold)).toBe(false)
	})

	// Regression: without `outerMarkNames`, a text node carrying two delimited
	// marks at once made each plugin's inserted delimiter drop the other mark,
	// so neither plugin ever saw a fully-delimited run - each kept re-wrapping
	// the other's fresh delimiter one layer deeper, forever.
	it('converges instead of endlessly re-wrapping a run carrying two delimited marks', () => {
		const editor = createEditor(
			'<p><strong><em>bold and italic</em></strong></p>',
			{
				extensions: [
					StarterKit,
					Extension.create({
						name: 'ensureNestedDelimiters',
						addProseMirrorPlugins() {
							const { bold, italic } = this.editor.schema.marks
							return [
								createEnsureDelimitersPlugin(bold, fixedDelimiter('**')),
								createEnsureDelimitersPlugin(italic, fixedDelimiter('_'), [
									'bold',
								]),
							]
						},
					}),
				],
			}
		)

		expect(editor.state.doc.textBetween(1, editor.state.doc.content.size)).toBe(
			'**_bold and italic_**'
		)
	})
})
