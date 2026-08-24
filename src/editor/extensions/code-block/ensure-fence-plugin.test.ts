import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

describe('createEnsureFencePlugin', () => {
	// Regression: the toolbar's toggle command (`chain.toggleCodeBlock()`) just
	// changes the current block's node type - it inserts no fence text, and
	// nothing else in this extension catches it the way typed backticks do via
	// `fence-input-rule.ts`. Without this safety net, the block looks fenced in
	// the editor while actually holding unfenced plain text underneath.
	it('wraps a code block the toolbar toggle produced with no fence', () => {
		const editor = new Editor({
			extensions,
			content: '<p>const total = 1</p>',
		})

		editor.commands.toggleCodeBlock()

		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
		expect(editor.state.doc.firstChild?.textContent).toBe(
			'```\nconst total = 1\n```'
		)
	})

	it('wraps an empty code block the toolbar toggle produced', () => {
		const editor = new Editor({ extensions, content: '' })

		editor.commands.toggleCodeBlock()

		expect(editor.state.doc.firstChild?.textContent).toBe('```\n```')
	})

	it('leaves an already-fenced block alone', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					content: [{ type: 'text', text: '```ts\nconst total = 1\n```' }],
				},
			],
		})

		expect(editor.state.doc.firstChild?.textContent).toBe(
			'```ts\nconst total = 1\n```'
		)
	})

	it('leaves a block mid-typed backticks alone rather than re-wrapping it', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent({
			type: 'doc',
			content: [{ type: 'codeBlock', content: [{ type: 'text', text: '``' }] }],
		})

		expect(editor.state.doc.firstChild?.textContent).toBe('``')
	})
})
