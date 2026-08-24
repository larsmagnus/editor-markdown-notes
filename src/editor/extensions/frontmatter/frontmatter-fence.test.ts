import { describe, expect, it } from 'vitest'

import {
	frontmatterFenceText,
	frontmatterYaml,
	parseFrontmatterFence,
} from '@/editor/extensions/frontmatter/frontmatter-fence'

describe('parseFrontmatterFence', () => {
	it('parses a well-formed frontmatter block', () => {
		const text = '---\nname: notes\ncolor: purple\n---'

		expect(parseFrontmatterFence(text)).toEqual({
			codeFrom: 4,
			codeTo: 29,
			hasClosingFence: true,
		})
		expect(frontmatterYaml(text)).toBe('name: notes\ncolor: purple')
	})

	it('parses a block with no closing fence yet', () => {
		const text = '---\nname: notes'

		expect(parseFrontmatterFence(text)).toEqual({
			codeFrom: 4,
			codeTo: text.length,
			hasClosingFence: false,
		})
	})

	it('parses an empty frontmatter block', () => {
		const text = '---\n---'

		expect(parseFrontmatterFence(text)).toEqual({
			codeFrom: 4,
			codeTo: 4,
			hasClosingFence: true,
		})
		expect(frontmatterYaml(text)).toBe('')
	})

	it('parses a block that was just opened, with no newline typed yet', () => {
		const text = '---'

		expect(parseFrontmatterFence(text)).toEqual({
			codeFrom: 3,
			codeTo: 3,
			hasClosingFence: false,
		})
	})

	it('treats text with no fence at all as unparsed, fence-free content', () => {
		const text = 'name: notes'

		expect(parseFrontmatterFence(text)).toEqual({
			codeFrom: 0,
			codeTo: text.length,
			hasClosingFence: false,
		})
	})
})

describe('frontmatterFenceText', () => {
	it('wraps YAML in fence lines', () => {
		expect(frontmatterFenceText('name: notes')).toBe('---\nname: notes\n---')
	})

	// A parse/build round trip through an empty block used to insert a blank
	// line an originally-empty `---\n---` file never had, so re-serializing it
	// after any unrelated edit silently added a line.
	it('wraps an empty string with no blank line between the fences', () => {
		expect(frontmatterFenceText('')).toBe('---\n---')
		expect(parseFrontmatterFence(frontmatterFenceText(''))).toEqual(
			parseFrontmatterFence('---\n---')
		)
	})
})
