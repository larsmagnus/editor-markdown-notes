import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ButtonNodeAction } from '@/editor/button-node-action'

describe('ButtonNodeAction', () => {
	it('uses the label as its accessible name and calls onClick', async () => {
		const onClick = vi.fn()
		render(
			<TooltipProvider>
				<ButtonNodeAction icon={<span />} label="Copy code" onClick={onClick} />
			</TooltipProvider>
		)

		await userEvent.click(screen.getByLabelText('Copy code'))

		expect(onClick).toHaveBeenCalledOnce()
	})

	it('shows a shorter tooltip when one is given, falling back to the label otherwise', async () => {
		render(
			<TooltipProvider>
				<ButtonNodeAction
					icon={<span />}
					label="Copy code"
					tooltip="Copy"
					onClick={vi.fn()}
				/>
			</TooltipProvider>
		)

		await userEvent.hover(screen.getByLabelText('Copy code'))

		expect(await screen.findByText('Copy')).toBeInTheDocument()
		expect(screen.queryByText('Copy code')).not.toBeInTheDocument()
	})

	it('is not treated as editable content inside a node view', () => {
		render(
			<TooltipProvider>
				<ButtonNodeAction icon={<span />} label="Delete" onClick={vi.fn()} />
			</TooltipProvider>
		)

		expect(screen.getByLabelText('Delete')).toHaveAttribute(
			'contenteditable',
			'false'
		)
	})
})
