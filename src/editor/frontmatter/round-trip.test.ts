import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { splitFrontmatter } from '@/lib/frontmatter'

const editors: Editor[] = []

/**
 * Runs markdown through the exact extension set the app ships with, then reads
 * it back out the same way the auto-save does.
 */
function roundTrip(markdown: string): string {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

/**
 * Reproduces `useFrontmatterDocument`'s two-step path: split the fence off
 * with `splitFrontmatter`, then insert the node programmatically. markdown-it
 * has no concept of frontmatter, so `roundTrip` alone would hand it a raw
 * `---` fence and hit lazy-continuation paragraph merging on multi-line
 * content - a real risk this test would otherwise hide.
 */
function roundTripWithFrontmatter(markdown: string): string {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	const { frontmatter, body } = splitFrontmatter(markdown)
	editor.commands.setContent(body)
	editor.commands.insertContentAt(0, {
		type: 'frontmatter',
		content: frontmatter ? [{ type: 'text', text: frontmatter }] : [],
	})
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('frontmatter', () => {
	it('keeps frontmatter attached to its note', () => {
		const markdown = [
			'---',
			'title: Roadmap',
			'status: draft',
			'---',
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n')

		expect(roundTripWithFrontmatter(markdown)).toBe(markdown)
	})

	it('round-trips a frontmatter-only note with no body', () => {
		const markdown = '---\ntitle: Roadmap\n---'

		expect(roundTripWithFrontmatter(markdown)).toBe(markdown)
	})

	it('round-trips an intentionally empty frontmatter block', () => {
		const markdown = '---\n---\n\n# Roadmap'

		expect(roundTripWithFrontmatter(markdown)).toBe(markdown)
	})

	// A document that legitimately opens with two horizontal rules and content
	// between them is indistinguishable from typed frontmatter by shape alone -
	// an accepted false positive, documented here rather than solved.
	it('promotes a document that opens with two horizontal rules, even without frontmatter intent', () => {
		const markdown = ['---', '', 'Some text.', '', '---'].join('\n')

		expect(roundTrip(markdown)).toBe('---\nSome text.\n---')
	})
})
