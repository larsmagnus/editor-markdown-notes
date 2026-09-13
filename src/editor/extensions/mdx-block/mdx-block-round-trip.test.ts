import { describe, expect, it } from 'vitest'

import { buildExtensions } from '#src/editor/extensions/build-extensions'
import { restoreMdxBlocksInTransaction } from '#src/editor/extensions/mdx-block/restore-mdx-blocks'
import { spliceMdxPlaceholders } from '#src/editor/extensions/mdx-block/splice-mdx-placeholders'
import { createEditor } from '#src/test-utils/editor'

/**
 * Reproduces `useFrontmatterDocument`'s mdx path: splice placeholders in,
 * load through `setContent` (the app's real load path), restore the real
 * `mdxBlock` nodes in the same transaction, then read the note back out the
 * way auto-save does.
 */
function roundTrip(markdown: string): string {
	const editor = createEditor(undefined, { extensions: buildExtensions('mdx') })
	const { text, blocks } = spliceMdxPlaceholders(markdown)

	editor.commands.setContent(text)
	if (blocks.length > 0) {
		editor.commands.command(({ tr, state }) => {
			restoreMdxBlocksInTransaction(tr, state.schema, blocks)
			return true
		})
	}

	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

describe('mdxBlock round-trip', () => {
	it('preserves a top-level import statement byte-for-byte', () => {
		const markdown = [
			"import Foo from './foo.jsx'",
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('preserves a top-level export statement byte-for-byte', () => {
		const markdown = ['# Roadmap', '', 'export const bar = 42'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('preserves a multi-line JSX element byte-for-byte', () => {
		const markdown = [
			'# Roadmap',
			'',
			'<Foo prop={1}>',
			'  <span>child</span>',
			'</Foo>',
			'',
			'Ship it.',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('preserves a top-level {expression} block byte-for-byte', () => {
		const markdown = ['# Roadmap', '', '{1 + 2}'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('preserves multiple spans in the same document, each in its own block', () => {
		const markdown = [
			"import Foo from './foo.jsx'",
			'',
			'# Roadmap',
			'',
			'<Foo />',
			'',
			'Ship it.',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('leaves prose elsewhere in the document live-edited, not opaque', () => {
		const markdown = [
			"import Foo from './foo.jsx'",
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n')

		const editor = createEditor(undefined, {
			extensions: buildExtensions('mdx'),
		})
		const { text, blocks } = spliceMdxPlaceholders(markdown)
		editor.commands.setContent(text)
		editor.commands.command(({ tr, state }) => {
			restoreMdxBlocksInTransaction(tr, state.schema, blocks)
			return true
		})

		const heading = editor.state.doc.child(1)
		expect(heading.type.name).toBe('heading')

		const importBlock = editor.state.doc.child(0)
		expect(importBlock.type.name).toBe('mdxBlock')
	})

	it('does not protect JSX-looking text inside a fenced code block, and leaves it untouched', () => {
		const markdown = ['# Roadmap', '', '```', '<Foo prop={1} />', '```'].join(
			'\n'
		)

		expect(roundTrip(markdown)).toBe(markdown)
	})
})
