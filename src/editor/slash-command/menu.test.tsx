import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GitBranch, Table2 } from 'lucide-react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { SlashCommandItem } from '@/editor/slash-command/commands'
import { SlashCommandMenu } from '@/editor/slash-command/menu'
import type { SlashCommandMenuHandle } from '@/editor/slash-command/menu'

const ITEMS: SlashCommandItem[] = [
	{
		id: 'mermaid',
		label: 'Mermaid diagram',
		keywords: [],
		icon: GitBranch,
		run: vi.fn(),
	},
	{ id: 'table', label: 'Table', keywords: [], icon: Table2, run: vi.fn() },
]

describe('SlashCommandMenu', () => {
	it('lists every item passed to it', () => {
		render(<SlashCommandMenu items={ITEMS} onSelect={vi.fn()} />)

		expect(
			screen.getByRole('option', { name: 'Mermaid diagram' })
		).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'Table' })).toBeInTheDocument()
	})

	it('shows a fallback when nothing matches the query', () => {
		render(<SlashCommandMenu items={[]} onSelect={vi.fn()} />)

		expect(screen.getByText('No results')).toBeInTheDocument()
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
	})

	it('selects an item by clicking it', async () => {
		const onSelect = vi.fn()
		render(<SlashCommandMenu items={ITEMS} onSelect={onSelect} />)

		await userEvent.click(screen.getByRole('option', { name: 'Table' }))

		expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
	})

	it('moves the highlight with ArrowDown/ArrowUp, wrapping at both ends', () => {
		const ref = createRef<SlashCommandMenuHandle>()
		render(<SlashCommandMenu ref={ref} items={ITEMS} onSelect={vi.fn()} />)

		expect(
			screen.getByRole('option', { name: 'Mermaid diagram' })
		).toHaveAttribute('aria-selected', 'true')

		act(() =>
			ref.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
		)
		expect(screen.getByRole('option', { name: 'Table' })).toHaveAttribute(
			'aria-selected',
			'true'
		)

		act(() =>
			ref.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
		)
		expect(
			screen.getByRole('option', { name: 'Mermaid diagram' })
		).toHaveAttribute('aria-selected', 'true')

		act(() =>
			ref.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
		)
		expect(screen.getByRole('option', { name: 'Table' })).toHaveAttribute(
			'aria-selected',
			'true'
		)
	})

	it('selects the highlighted item on Enter', () => {
		const onSelect = vi.fn()
		const ref = createRef<SlashCommandMenuHandle>()
		render(<SlashCommandMenu ref={ref} items={ITEMS} onSelect={onSelect} />)

		act(() =>
			ref.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
		)
		act(() =>
			ref.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))
		)

		expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
	})

	it('reports keys it does not handle so the caller can let them through', () => {
		const ref = createRef<SlashCommandMenuHandle>()
		render(<SlashCommandMenu ref={ref} items={ITEMS} onSelect={vi.fn()} />)

		const handled = ref.current?.onKeyDown(
			new KeyboardEvent('keydown', { key: 'a' })
		)

		expect(handled).toBe(false)
	})
})
