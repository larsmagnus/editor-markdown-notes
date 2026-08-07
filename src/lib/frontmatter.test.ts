import { describe, expect, it } from 'vitest'

import { joinFrontmatter, splitFrontmatter } from '@/lib/frontmatter'

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
		})
	})

	it('returns null frontmatter and the untouched body when there is none', () => {
		const markdown = '# Roadmap\n\nShip it.'

		expect(splitFrontmatter(markdown)).toEqual({
			frontmatter: null,
			body: markdown,
		})
	})

	it('extracts frontmatter from a note that has no body', () => {
		const markdown = '---\ntitle: Roadmap\n---'

		expect(splitFrontmatter(markdown)).toEqual({
			frontmatter: 'title: Roadmap',
			body: '',
		})
	})
})

describe('joinFrontmatter', () => {
	it('reassembles a note that matches what a human would have written', () => {
		const original = [
			'---',
			'title: Roadmap',
			'status: draft',
			'---',
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n')

		const { frontmatter, body } = splitFrontmatter(original)

		expect(joinFrontmatter(frontmatter, body)).toBe(original)
	})

	it('returns just the body when there is no frontmatter block', () => {
		const body = '# Roadmap\n\nShip it.'

		expect(joinFrontmatter(null, body)).toBe(body)
	})

	it('keeps an intentionally empty frontmatter block on save', () => {
		const body = '# Roadmap\n\nShip it.'

		expect(joinFrontmatter('', body)).toBe('---\n---\n\n# Roadmap\n\nShip it.')
		expect(joinFrontmatter('   \n  ', body)).toBe(
			'---\n---\n\n# Roadmap\n\nShip it.'
		)
	})
})
