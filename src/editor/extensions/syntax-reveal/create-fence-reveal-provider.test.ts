import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { parseFence } from '@/editor/extensions/code-block/code-fence'
import { parseFrontmatterFence } from '@/editor/extensions/frontmatter/frontmatter-fence'
import { createFenceRevealProvider } from '@/editor/extensions/syntax-reveal/create-fence-reveal-provider'

describe('createFenceRevealProvider', () => {
	it('spans the whole block as the container, and both fence lines as syntax ranges', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<pre><code>```ts\nconst total = 1\n```</code></pre>'
		)

		const [span] = createFenceRevealProvider(['codeBlock'], parseFence).collect(
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

		const [span] = createFenceRevealProvider(['codeBlock'], parseFence).collect(
			editor.state.doc
		)

		expect(span.syntaxRanges).toHaveLength(1)
	})

	it('ignores node types not in the given list', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello</p>')

		const spans = createFenceRevealProvider(['codeBlock'], parseFence).collect(
			editor.state.doc
		)

		expect(spans).toHaveLength(0)
	})

	it('works with the frontmatter fence parser too', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		// A JSON text node, not an HTML string: a plain paragraph's HTML parsing
		// collapses embedded newlines into spaces, which a fence parser can't
		// tell apart from a fence line's own trailing whitespace.
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '---\nname: notes\n---' }],
				},
			],
		})

		const [span] = createFenceRevealProvider(
			['paragraph'],
			parseFrontmatterFence
		).collect(editor.state.doc)

		// "---\n" (4 chars) starting right after the node's own opening token.
		expect(span.syntaxRanges[0]).toEqual([1, 5])
	})
})
