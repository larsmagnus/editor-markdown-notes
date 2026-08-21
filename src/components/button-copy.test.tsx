import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ButtonCopy } from '@/components/button-copy'
import { TooltipProvider } from '@/components/ui/tooltip'

describe('ButtonCopy', () => {
	it('calls onClick when clicked', async () => {
		const onClick = vi.fn()
		render(
			<TooltipProvider>
				<ButtonCopy copied={false} label="Copy frontmatter" onClick={onClick} />
			</TooltipProvider>
		)

		await userEvent.click(screen.getByLabelText('Copy frontmatter'))

		expect(onClick).toHaveBeenCalledOnce()
	})

	it('shows the "Copied" badge when copied is true', () => {
		render(
			<TooltipProvider>
				<ButtonCopy copied label="Copy frontmatter" onClick={vi.fn()} />
			</TooltipProvider>
		)

		expect(screen.getByRole('status')).toHaveTextContent('Copied')
	})

	it('hides the "Copied" badge when copied is false', () => {
		render(
			<TooltipProvider>
				<ButtonCopy copied={false} label="Copy frontmatter" onClick={vi.fn()} />
			</TooltipProvider>
		)

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})

	it('shows a "Copy" tooltip when hovering the button', async () => {
		render(
			<TooltipProvider>
				<ButtonCopy copied={false} label="Copy frontmatter" onClick={vi.fn()} />
			</TooltipProvider>
		)

		await userEvent.hover(screen.getByLabelText('Copy frontmatter'))

		expect(await screen.findByText('Copy')).toBeInTheDocument()
	})
})
