import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

function documentFrom(markdown: string) {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('detectFrontmatter', () => {
	it('promotes a --- / content / --- block at the top of the document', () => {
		const editor = documentFrom(
			['---', '', 'title: Roadmap', '', '---', '', '# Roadmap'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('title: Roadmap')
	})

	it('does not convert without a closing fence', () => {
		const editor = documentFrom(
			['---', '', 'title: Roadmap', '', 'More text.'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).not.toBe('frontmatter')
	})

	it('does not convert a horizontal-rule pair that is not at the start of the document', () => {
		const editor = documentFrom(
			['# Roadmap', '', '---', '', 'Some text.', '', '---'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name === 'frontmatter').toBe(false)
	})

	it('converts an empty block with nothing between the fences', () => {
		const editor = documentFrom(['---', '', '---', '', '# Roadmap'].join('\n'))

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('')
	})

	it('creates an empty block and leaves the rest untouched when a heading sits between the fences', () => {
		const editor = documentFrom(
			[
				'---',
				'',
				'# Roadmap',
				'',
				'Ship it.',
				'',
				'---',
				'',
				'More text.',
			].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('')
		// Everything after the empty block - including the fence that would have
		// closed a real frontmatter block - survives exactly as typed.
		expect(editor.state.doc.child(1).type.name).toBe('heading')
		expect(editor.state.doc.child(1).textContent).toBe('Roadmap')
		expect(editor.state.doc.child(2).textContent).toBe('Ship it.')
		expect(editor.state.doc.child(3).type.name).toBe('horizontalRule')
		expect(editor.state.doc.child(4).textContent).toBe('More text.')
	})

	it('creates an empty block and leaves an image between the fences untouched', () => {
		const editor = documentFrom(
			['---', '', '![alt](./image.png)', '', '---'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('')
		expect(editor.state.doc.child(1).firstChild?.type.name === 'image').toBe(
			true
		)
	})

	it('sweeps plain paragraphs between the fences as before, marks and all', () => {
		const editor = documentFrom(
			['---', '', '**title**: Roadmap', '', '---', '', '# Roadmap'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('title: Roadmap')
	})

	it('adds a trailing empty paragraph when the whole document is the pattern', () => {
		const editor = documentFrom(
			['---', '', 'title: Roadmap', '', '---'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.childCount).toBe(2)
		expect(editor.state.doc.lastChild?.type.name).toBe('paragraph')
	})

	// A real Ctrl+Z round trip through `editor.commands.undo()` is exercised at
	// the integration level (`editor.test.tsx`), where actual keystrokes land in
	// separate history groups. Scripting the same two transactions back-to-back
	// here, with no real time between them, would have `prosemirror-history`'s
	// own (well-tested) grouping heuristic merge them into one step regardless
	// of anything this code does - so what's worth asserting here is the one
	// thing this plugin actually controls: it never opts the promotion out of
	// history.
	it('does not opt the promotion out of the undo history', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		const historyEligible: boolean[] = []
		editor.on('transaction', ({ transaction }) => {
			historyEligible.push(transaction.getMeta('addToHistory') !== false)
		})

		editor.commands.setContent(
			['---', '', 'title: Roadmap', '', '---', '', '# Roadmap'].join('\n')
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(historyEligible.every(Boolean)).toBe(true)
	})

	it('does not re-fire on unrelated subsequent edits', () => {
		const editor = documentFrom(
			['---', '', 'title: Roadmap', '', '---', '', '# Roadmap'].join('\n')
		)
		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')

		editor.commands.insertContentAt(editor.state.doc.content.size, ' more')

		const frontmatterNodes: string[] = []
		editor.state.doc.forEach((node) => frontmatterNodes.push(node.type.name))

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(
			frontmatterNodes.filter((name) => name === 'frontmatter')
		).toHaveLength(1)
	})
})
