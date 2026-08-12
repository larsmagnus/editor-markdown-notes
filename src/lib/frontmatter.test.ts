import { describe, expect, it } from 'vitest'

import { splitFrontmatter } from '@/lib/frontmatter'

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
