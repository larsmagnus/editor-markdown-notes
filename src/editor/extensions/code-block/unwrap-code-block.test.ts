import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { unwrapCodeBlockAtFenceStart } from '@/editor/extensions/code-block/unwrap-code-block'

describe('unwrapCodeBlockAtFenceStart', () => {
	it('replaces the code block with a paragraph holding its stripped code', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<pre><code>```ts\nconst total = 1\n```</code></pre>'
		)
		editor.commands.setTextSelection(1) // start of the fence line

		const applied = unwrapCodeBlockAtFenceStart('codeBlock')(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(true)
		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('const total = 1')
	})

	it('produces an empty paragraph for a block with no code yet', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<pre><code>```ts</code></pre>')
		editor.commands.setTextSelection(1)

		unwrapCodeBlockAtFenceStart('codeBlock')(editor.state, editor.view.dispatch)

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('')
	})

	it('declines when the caret is not at the very start of the block', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<pre><code>```ts\nconst total = 1\n```</code></pre>'
		)
		editor.commands.setTextSelection(3)

		const applied = unwrapCodeBlockAtFenceStart('codeBlock')(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(false)
		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
	})

	it('declines with a non-empty selection', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<pre><code>```ts\nconst total = 1\n```</code></pre>'
		)
		editor.commands.setTextSelection({ from: 1, to: 4 })

		const applied = unwrapCodeBlockAtFenceStart('codeBlock')(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(false)
	})

	it('declines outside a code block', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello</p>')
		editor.commands.setTextSelection(1)

		const applied = unwrapCodeBlockAtFenceStart('codeBlock')(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(false)
	})
})
