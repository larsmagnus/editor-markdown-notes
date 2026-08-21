import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import { PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Editor, Extension } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { createDecorationPlugin } from '@/editor/create-decoration-plugin'
import { extensions } from '@/editor/extensions'

type TestRange = { from: number; to: number }

const testPluginKey = new PluginKey<DecorationSet>('testDecoration')

function toDecorations(
	doc: ProseMirrorNode,
	ranges: TestRange[]
): DecorationSet {
	return DecorationSet.create(
		doc,
		ranges.map(({ from, to }) =>
			Decoration.inline(from, to, { class: 'test-mark' })
		)
	)
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		testDecoration: {
			setTestRanges: (ranges: TestRange[] | null) => ReturnType
		}
	}
}

const setTestRangesCommand = {
	addCommands() {
		return {
			setTestRanges:
				(ranges: TestRange[] | null) =>
				({
					tr,
					dispatch,
				}: {
					tr: Transaction
					dispatch?: (tr: Transaction) => void
				}) => {
					if (dispatch) dispatch(tr.setMeta(testPluginKey, ranges))
					return true
				},
		}
	},
}

const ClearableTestDecoration = Extension.create({
	name: 'testDecoration',
	...setTestRangesCommand,
	addProseMirrorPlugins() {
		return [
			createDecorationPlugin(testPluginKey, toDecorations, { clearable: true }),
		]
	},
})

const StickyTestDecoration = Extension.create({
	name: 'testDecoration',
	...setTestRangesCommand,
	addProseMirrorPlugins() {
		return [createDecorationPlugin(testPluginKey, toDecorations)]
	},
})

const editors: Editor[] = []

function editorWith(extension: typeof ClearableTestDecoration) {
	const editor = new Editor({
		extensions: [...extensions, extension],
		content: '<p>hello world</p>',
	})
	editors.push(editor)
	return editor
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('createDecorationPlugin', () => {
	it('renders the decorations its toDecorations is handed', () => {
		const editor = editorWith(StickyTestDecoration)

		editor.commands.setTestRanges([{ from: 1, to: 6 }])

		expect(editor.view.dom.innerHTML).toContain('class="test-mark"')
	})

	it('maps existing decorations through an edit elsewhere, rather than dropping them', () => {
		const editor = editorWith(StickyTestDecoration)
		editor.commands.setTestRanges([{ from: 1, to: 6 }])

		// Inserted at the end of the document, well past the decorated range.
		editor.commands.insertContentAt(editor.state.doc.content.size, '!')

		expect(editor.view.dom.innerHTML).toContain('class="test-mark"')
	})

	it('does not change the document when setting decorations', () => {
		const editor = editorWith(StickyTestDecoration)
		const before = String(editor.storage.markdown.getMarkdown())

		editor.commands.setTestRanges([{ from: 1, to: 6 }])

		expect(String(editor.storage.markdown.getMarkdown())).toBe(before)
	})

	it('clears its decorations on null meta when clearable', () => {
		const editor = editorWith(ClearableTestDecoration)
		editor.commands.setTestRanges([{ from: 1, to: 6 }])

		editor.commands.setTestRanges(null)

		expect(editor.view.dom.innerHTML).not.toContain('class="test-mark"')
	})

	it('keeps its decorations on null meta when not clearable', () => {
		const editor = editorWith(StickyTestDecoration)
		editor.commands.setTestRanges([{ from: 1, to: 6 }])

		editor.commands.setTestRanges(null)

		expect(editor.view.dom.innerHTML).toContain('class="test-mark"')
	})
})

describe('createDecorationPlugin props merging', () => {
	it('merges in extra editor props alongside decorations', () => {
		let clicked = false
		const WithMousedown = Extension.create({
			name: 'testDecoration',
			...setTestRangesCommand,
			addProseMirrorPlugins() {
				return [
					createDecorationPlugin(testPluginKey, toDecorations, {
						props: {
							handleDOMEvents: {
								mousedown: () => {
									clicked = true
									return false
								},
							},
						},
					}),
				]
			},
		})
		const editor = editorWith(WithMousedown)

		editor.view.dom.dispatchEvent(
			new MouseEvent('mousedown', { bubbles: true, cancelable: true })
		)

		expect(clicked).toBe(true)
	})
})
