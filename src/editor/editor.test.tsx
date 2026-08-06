import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Editor from '@/editor/editor'

describe('Editor', () => {
	it('renders a markdown table as a real table', async () => {
		const content = [
			'| Quarter | Revenue | Growth |',
			'| --- | --- | --- |',
			'| Q1 2025 | 1.2M | 8% |',
			'| Q2 2025 | 1.4M | 17% |',
		].join('\n')

		render(<Editor content={content} />)

		const table = await screen.findByRole('table')
		expect(table).toBeInTheDocument()

		const headers = screen
			.getAllByRole('columnheader')
			.map((header) => header.textContent)
		expect(headers).toEqual(['Quarter', 'Revenue', 'Growth'])

		// One header row plus two body rows
		expect(screen.getAllByRole('row')).toHaveLength(3)
		expect(screen.getByRole('cell', { name: 'Q2 2025' })).toBeInTheDocument()
	})

	it('puts cell content straight into the cell, not into a paragraph', async () => {
		const content = [
			'| Quarter | Revenue |',
			'| --- | --- |',
			'| Q1 2025 | **1.2M** |',
		].join('\n')

		render(<Editor content={content} />)

		const table = await screen.findByRole('table')
		expect(table.querySelector('p')).toBeNull()
		expect(screen.getByRole('cell', { name: '1.2M' })).toContainHTML(
			'<strong>1.2M</strong>'
		)
	})

	it('renders a task list as checkboxes with their checked state', async () => {
		const content = ['- [x] Ship table support', '- [ ] Ship footnotes'].join(
			'\n'
		)

		render(<Editor content={content} />)

		const checkboxes = await screen.findAllByRole('checkbox')
		expect(checkboxes).toHaveLength(2)
		expect(checkboxes[0]).toBeChecked()
		expect(checkboxes[1]).not.toBeChecked()
	})

	it('renders an image with its alt text', async () => {
		const content =
			'![Editor Markdown Notes icon](/icon-editor-markdown-notes.png)'

		render(<Editor content={content} />)

		const image = await screen.findByRole('img', {
			name: 'Editor Markdown Notes icon',
		})
		expect(image).toHaveAttribute('src', '/icon-editor-markdown-notes.png')
	})

	it('renders a link for a bare URL', async () => {
		render(<Editor content="Docs live at https://example.com today." />)

		const link = await screen.findByRole('link', {
			name: 'https://example.com',
		})
		expect(link).toHaveAttribute('href', 'https://example.com')
	})
})
