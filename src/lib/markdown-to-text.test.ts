import { describe, expect, it } from 'vitest'

import { markdownToPlainText } from '@/lib/markdown-to-text'

describe('markdownToPlainText', () => {
	it('strips heading markers and keeps the heading text', () => {
		const markdown = '# Roadmap'

		expect(markdownToPlainText(markdown)).toBe('Roadmap')
	})

	it('strips emphasis and strong markers and keeps the text', () => {
		const markdown = 'Ship the *beta* release by **Friday**.'

		expect(markdownToPlainText(markdown)).toBe(
			'Ship the beta release by Friday.'
		)
	})

	it('strips inline code backticks and keeps the code text', () => {
		const markdown = 'Run `pnpm install` before starting.'

		expect(markdownToPlainText(markdown)).toBe(
			'Run pnpm install before starting.'
		)
	})

	it('strips link syntax and keeps the link text', () => {
		const markdown =
			'See the [release notes](https://example.com/notes) for details.'

		expect(markdownToPlainText(markdown)).toBe(
			'See the release notes for details.'
		)
	})

	it('strips image syntax and keeps the alt text', () => {
		const markdown = '![Architecture diagram](./diagram.png)'

		expect(markdownToPlainText(markdown)).toBe('Architecture diagram')
	})

	it('strips unordered list markers and separates items with newlines', () => {
		const markdown = '- Buy milk\n- Walk the dog\n- Ship the release'

		expect(markdownToPlainText(markdown)).toBe(
			'Buy milk\nWalk the dog\nShip the release'
		)
	})

	it('strips ordered list markers and separates items with newlines', () => {
		const markdown = '1. Buy milk\n2. Walk the dog\n3. Ship the release'

		expect(markdownToPlainText(markdown)).toBe(
			'Buy milk\nWalk the dog\nShip the release'
		)
	})

	it('strips blockquote markers and keeps the quoted text', () => {
		const markdown = '> Ship early, ship often.'

		expect(markdownToPlainText(markdown)).toBe('Ship early, ship often.')
	})

	it('keeps internal newlines inside a fenced code block verbatim', () => {
		const markdown = [
			'```js',
			'function greet(name) {',
			'  return `Hello, ${name}!`',
			'}',
			'```',
		].join('\n')

		expect(markdownToPlainText(markdown)).toBe(
			'function greet(name) {\n  return `Hello, ${name}!`\n}'
		)
	})

	it('joins table cells with a space instead of pipes', () => {
		const markdown = [
			'| Name | Role |',
			'| --- | --- |',
			'| Ada | Engineer |',
		].join('\n')

		expect(markdownToPlainText(markdown)).toBe('Name Role\n\nAda Engineer')
	})

	it('drops a horizontal rule entirely', () => {
		const markdown = 'Before the break.\n\n---\n\nAfter the break.'

		expect(markdownToPlainText(markdown)).toBe(
			'Before the break.\n\nAfter the break.'
		)
	})

	it('keeps frontmatter verbatim and strips markdown syntax from the body', () => {
		const markdown = [
			'---',
			'title: Roadmap',
			'status: draft',
			'---',
			'',
			'# Roadmap',
			'',
			'Ship it by **Friday**.',
		].join('\n')

		expect(markdownToPlainText(markdown)).toBe(
			'title: Roadmap\nstatus: draft\n\nRoadmap\n\nShip it by Friday.'
		)
	})
})
