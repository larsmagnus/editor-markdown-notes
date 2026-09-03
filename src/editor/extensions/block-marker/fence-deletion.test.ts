import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function documentFrom(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

/**
 * A code block's fences are its own text, so deleting them is how a writer
 * turns one back into a paragraph. Repair answering that with a fresh pair is
 * what made the block impossible to unwrap: every backtick deleted came back.
 */
describe('a fence the author deleted', () => {
	it('unwraps a code block into a paragraph holding its code', () => {
		const editor = documentFrom('```js\nconst x = 1\n```')
		// The opening fence line, "```js\n", at the very start of the block.
		editor.commands.deleteRange({ from: 1, to: 7 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('const x = 1')
	})

	it('unwraps a mermaid block the same way', () => {
		const editor = documentFrom('```mermaid\ngraph TD\n```')
		editor.commands.deleteRange({ from: 1, to: 12 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('graph TD')
	})

	it('does not grow a new fence when one backtick of the closing one goes', () => {
		const editor = documentFrom('```js\nconst x = 1\n```')
		const end = editor.state.doc.firstChild!.nodeSize - 1

		editor.commands.deleteRange({ from: end - 1, to: end })

		expect(editor.state.doc.firstChild?.textContent).not.toContain('``\n```')
	})

	it('unwraps a code block whose closing fence the author deleted', () => {
		const editor = documentFrom('```js\nconst x = 1\n```')
		const end = editor.state.doc.firstChild!.nodeSize - 1

		editor.commands.deleteRange({ from: end - 3, to: end })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('const x = 1')
	})

	it('unwraps a mermaid block whose closing fence the author deleted', () => {
		const editor = documentFrom('```mermaid\ngraph TD\n```')
		const end = editor.state.doc.firstChild!.nodeSize - 1

		editor.commands.deleteRange({ from: end - 3, to: end })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('graph TD')
	})

	// The node is built directly: the app splits frontmatter off before anything
	// reaches TipTap, so `setContent` on a note that opens with `---` gives a
	// horizontal rule, not this.
	it('does not grow a new fence when a frontmatter block loses its closing one', () => {
		const editor = documentFrom('# Notes')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\ntitle: Roadmap\n---' }],
		})
		const end = editor.state.doc.firstChild!.nodeSize - 1

		editor.commands.deleteRange({ from: end - 1, to: end })

		expect(editor.state.doc.firstChild?.textContent).not.toContain('--\n---')
	})

	// The fence line carries the language tag, which is ordinary editable text -
	// `code-block-extension.ts` reads it back to drive highlighting. Treating the
	// whole line as one marker made a single Backspace in it destroy the block.
	// The character deletion itself is the browser's, so this asserts only that
	// nothing claims the key; `e2e/code-block-fence.spec.ts` covers the edit.
	it('leaves Backspace in the language tag to ordinary text editing', () => {
		const editor = documentFrom('```javascript\nconst x = 1\n```')
		// The end of the fence line, right after "javascript".
		editor.commands.setTextSelection(14)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
	})

	it('edits a frontmatter fence line rather than unwrapping the block', () => {
		const editor = documentFrom('# Notes')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\ntitle: Roadmap\n---' }],
		})
		// Inside the YAML, one past the opening fence's newline.
		editor.commands.setTextSelection(6)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
	})

	// A rule's marker is its entire content, so text that no longer reads as a
	// rule is no longer a rule - there is no state where one should be repaired
	// back. Seeding a fresh `---` there prepends it to whatever was typed.
	it('unwraps a horizontal rule typed into rather than reseeding its dashes', () => {
		const editor = documentFrom('Above.\n\n---\n\nBelow.')
		const rule = editor.state.doc.child(1)
		expect(rule.type.name).toBe('horizontalRule')

		editor.commands.insertContentAt(10, 'x')

		expect(editor.state.doc.child(1).type.name).toBe('paragraph')
		expect(editor.state.doc.child(1).textContent).not.toContain('------')
	})

	it('still fences a code block that never had one', () => {
		const editor = documentFrom('Plain text')
		editor.commands.setTextSelection(3)
		editor.commands.toggleCodeBlock()

		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
		expect(editor.state.doc.firstChild?.textContent).toBe(
			'```\nPlain text\n```'
		)
	})
})
