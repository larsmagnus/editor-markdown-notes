import { describe, expect, it } from 'vitest'

import { getFileKind } from '#src/lib/file-kind'

describe('getFileKind', () => {
	it('returns txt for a .txt file', () => {
		expect(getFileKind('notes.txt')).toBe('txt')
	})

	it('returns txt for a .TXT file regardless of case', () => {
		expect(getFileKind('NOTES.TXT')).toBe('txt')
	})

	it('returns mdx for a .mdx file', () => {
		expect(getFileKind('notes.mdx')).toBe('mdx')
	})

	it('returns mdx for a .MDX file regardless of case', () => {
		expect(getFileKind('NOTES.MDX')).toBe('mdx')
	})

	it('returns markdown for a .md file', () => {
		expect(getFileKind('notes.md')).toBe('markdown')
	})

	it('returns markdown for a .markdown file', () => {
		expect(getFileKind('notes.markdown')).toBe('markdown')
	})

	it('returns markdown for a .mdown file', () => {
		expect(getFileKind('notes.mdown')).toBe('markdown')
	})

	it('returns markdown for a .mkd file', () => {
		expect(getFileKind('notes.mkd')).toBe('markdown')
	})

	it('returns markdown for a file with no extension', () => {
		expect(getFileKind('notes')).toBe('markdown')
	})

	it('returns markdown for a name merely ending in "txt" without a dot', () => {
		expect(getFileKind('script.txt.notxt')).toBe('markdown')
	})
})
