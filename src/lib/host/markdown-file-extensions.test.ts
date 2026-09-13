import { describe, expect, it } from 'vitest'

import { isMarkdownFile } from '#src/lib/host/markdown-file-extensions'

describe('isMarkdownFile', () => {
	it('matches a .md path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.md')).toBe(true)
	})

	it('matches a .markdown path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.markdown')).toBe(true)
	})

	it('matches a .mdown path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.mdown')).toBe(true)
	})

	it('matches a .mkd path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.mkd')).toBe(true)
	})

	it('matches a .mdx path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.mdx')).toBe(true)
	})

	it('matches a .txt path', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.txt')).toBe(true)
	})

	it('matches an extension case-insensitively', () => {
		expect(isMarkdownFile('/Users/lars/notes/NOTES.MD')).toBe(true)
	})

	it('does not match a .pdf path', () => {
		expect(isMarkdownFile('/Users/lars/notes/report.pdf')).toBe(false)
	})

	it('does not match a path with no extension', () => {
		expect(isMarkdownFile('/Users/lars/notes/README')).toBe(false)
	})

	it('does not match an extension that only appears mid-string', () => {
		expect(isMarkdownFile('/Users/lars/notes/todo.md.bak')).toBe(false)
	})
})
