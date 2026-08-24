import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createCodeFenceRevealProvider } from '@/editor/extensions/code-block/code-fence-reveal-provider'

describe('createCodeFenceRevealProvider', () => {
	it('spans the whole block as the container, and both fence lines as syntax ranges', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<pre><code>```ts\nconst total = 1\n```</code></pre>'
		)

		const [span] = createCodeFenceRevealProvider(['codeBlock']).collect(
			editor.state.doc
		)

		expect(span.containerFrom).toBe(0)
		// The node's own size: 25 characters of text plus its start/end tokens.
		expect(span.containerTo).toBe(27)
		// "```ts\n" (6 chars) starting right after the node's own opening token.
		expect(span.syntaxRanges[0]).toEqual([1, 7])
		// "\n```" (4 chars) trailing the code.
		expect(span.syntaxRanges[1]).toEqual([22, 26])
	})

	it('omits the closing-fence range for a block with no closing fence yet', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<pre><code>```ts\nconst total = 1</code></pre>')

		const [span] = createCodeFenceRevealProvider(['codeBlock']).collect(
			editor.state.doc
		)

		expect(span.syntaxRanges).toHaveLength(1)
	})

	it('ignores node types not in the given list', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello</p>')

		const spans = createCodeFenceRevealProvider(['codeBlock']).collect(
			editor.state.doc
		)

		expect(spans).toHaveLength(0)
	})
})
