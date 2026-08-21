import { describe, expect, it } from 'vitest'

import { splitFrontmatter } from '@/lib/host/frontmatter'

describe('splitFrontmatter', () => {
	it('extracts the frontmatter block and leaves the rest as the body', () => {
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

		expect(splitFrontmatter(markdown)).toEqual({
			frontmatter: 'title: Roadmap\nstatus: draft',
			body: '# Roadmap\n\nShip it.',
			lineOffset: 5,
		})
	})

	it('returns null frontmatter and the untouched body when there is none', () => {
		const markdown = '# Roadmap\n\nShip it.'

		expect(splitFrontmatter(markdown)).toEqual({
			frontmatter: null,
			body: markdown,
			lineOffset: 0,
		})
	})

	it('extracts frontmatter from a note that has no body', () => {
		const markdown = '---\ntitle: Roadmap\n---'

		expect(splitFrontmatter(markdown)).toEqual({
			frontmatter: 'title: Roadmap',
			body: '',
			lineOffset: 2,
		})
	})

	describe('lineOffset', () => {
		it('counts the fences alone when the body follows immediately', () => {
			const markdown = '---\ntitle: Roadmap\n---\n# Roadmap'

			const { body, lineOffset } = splitFrontmatter(markdown)

			expect(lineOffset).toBe(3)
			expect(body.split('\n')[0]).toBe('# Roadmap')
		})

		it('counts the blank line too when one separates the fences from the body', () => {
			const markdown = '---\ntitle: Roadmap\n---\n\n# Roadmap'

			const { body, lineOffset } = splitFrontmatter(markdown)

			expect(lineOffset).toBe(4)
			expect(body.split('\n')[0]).toBe('# Roadmap')
		})

		it('places a source line at the same text once shifted into the body', () => {
			const markdown = [
				'---',
				'title: Roadmap',
				'status: draft',
				'---',
				'',
				'# Roadmap',
				'',
				'<input id="email" />',
			].join('\n')

			const { body, lineOffset } = splitFrontmatter(markdown)

			// `<input` sits on source line 8, which is 7 counting from zero.
			expect(body.split('\n')[7 - lineOffset]).toBe('<input id="email" />')
		})
	})
})
