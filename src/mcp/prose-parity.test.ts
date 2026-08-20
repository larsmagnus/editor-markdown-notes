import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { splitFrontmatter } from '@/lib/frontmatter'
import { getDocumentText } from '@/lib/text-tools/document-text'
import { markdownProse } from '@/mcp/markdown-text'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

/**
 * The guard on the one thing the panel and the MCP server implement twice.
 *
 * Everything downstream of prose extraction - the rules, the severities, the
 * readability tiers, the speller - is literally the same code called from two
 * places. Extraction is not, because the editor's schema needs React node views
 * that the MCP server's process cannot load. So the two walks are compared here
 * directly on the text they hand retext: if they ever disagree, the MCP server
 * starts reporting findings the sidebar does not, which is the failure this
 * whole arrangement exists to prevent.
 */
function proseFromEditor(markdown: string) {
	// Built the way `use-frontmatter-document.ts` builds it, not by handing the
	// whole file to `content`: markdown-it has no concept of frontmatter and
	// parses `---` as an `<hr>`, so the app splits it off and inserts it as a
	// node. A harness that skipped that step would compare against a document
	// shape the editor never actually holds.
	const { frontmatter, body } = splitFrontmatter(markdown)
	const editor = new Editor({ extensions, content: body })
	currentEditor = editor

	if (frontmatter !== null) {
		editor
			.chain()
			.insertContentAt(0, {
				type: 'frontmatter',
				content: frontmatter ? [{ type: 'text', text: frontmatter }] : [],
			})
			.run()
	}

	return getDocumentText(editor.state.doc).text
}

describe('prose extraction parity', () => {
	const cases: Record<string, string> = {
		'separate blocks': 'First one.\n\nSecond one.',
		'a heading and a paragraph': '# The title\n\nThe body text.',
		'a fenced code block':
			'Real prose here.\n\n```js\nconst utilize = 1\n```\n\nMore prose.',
		'an inline code span': 'Run `pnpm build` before you commit.',
		'an image between words': 'Before ![alt](a.png) after.',
		'emphasis and strong': 'This is *very* and **truly** fine.',
		'a link': 'Read [the guide](https://example.com/guide) first.',
		'a bullet list': 'Intro line.\n\n- First item.\n- Second item.',
		'a blockquote': 'Intro line.\n\n> A quoted sentence.',
		'frontmatter with prose values':
			'---\ntitle: The report was written\nslug: og_image\n---\n\nBody text.',
	}

	for (const [name, markdown] of Object.entries(cases)) {
		it(`agrees on ${name}`, () => {
			expect(markdownProse(markdown).text).toBe(proseFromEditor(markdown))
		})
	}
})
