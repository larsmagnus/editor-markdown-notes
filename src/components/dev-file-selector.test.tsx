import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import DevFileSelector from '@/components/dev-file-selector'

const NOTES = [
	{ value: 'notes.md', label: 'notes.md' },
	{ value: 'other-note.md', label: 'other-note.md' },
]

describe('DevFileSelector', () => {
	it('shows the label of the selected file', () => {
		render(
			<DevFileSelector
				value="other-note.md"
				setValue={() => {}}
				values={NOTES}
			/>
		)

		expect(screen.getByRole('combobox')).toHaveTextContent('other-note.md')
	})

	it('prompts when nothing is selected', () => {
		render(<DevFileSelector value="" setValue={() => {}} values={NOTES} />)

		expect(screen.getByRole('combobox')).toHaveTextContent('Select file...')
	})

	it('selects a different file', async () => {
		const setValue = vi.fn()
		render(
			<DevFileSelector value="notes.md" setValue={setValue} values={NOTES} />
		)

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.click(screen.getByRole('option', { name: 'other-note.md' }))

		expect(setValue).toHaveBeenCalledWith('other-note.md')
	})

	it('filters the list as you search', async () => {
		render(
			<DevFileSelector value="notes.md" setValue={() => {}} values={NOTES} />
		)

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.type(
			screen.getByPlaceholderText('Search files...'),
			'other'
		)

		expect(
			screen.getByRole('option', { name: 'other-note.md' })
		).toBeInTheDocument()
		expect(
			screen.queryByRole('option', { name: 'notes.md' })
		).not.toBeInTheDocument()
	})

	it('reports no match for a search that finds nothing', async () => {
		render(
			<DevFileSelector value="notes.md" setValue={() => {}} values={NOTES} />
		)

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.type(
			screen.getByPlaceholderText('Search files...'),
			'nothing'
		)

		expect(screen.getByText('No file found.')).toBeInTheDocument()
	})

	/**
	 * Re-picking the open file clears the selection rather than being a no-op,
	 * which leaves the caller fetching an empty file name.
	 */
	it('clears the selection when the open file is picked again', async () => {
		const setValue = vi.fn()
		render(
			<DevFileSelector value="notes.md" setValue={setValue} values={NOTES} />
		)

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.click(screen.getByRole('option', { name: 'notes.md' }))

		expect(setValue).toHaveBeenCalledWith('')
	})
})
