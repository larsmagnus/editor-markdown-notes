import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AskProposalState } from '@/editor/ask/ask-suggestion-extension'

import { AskProposalWidget } from './ask-proposal-widget'

const BASE_PROPOSAL: AskProposalState = {
	id: 'proposal-1',
	from: 1,
	to: 6,
	prompt: 'Shorten this',
	status: 'streaming',
	text: '',
}

describe('AskProposalWidget', () => {
	it('shows a placeholder while streaming, disabling accept, retry and close', () => {
		render(
			<AskProposalWidget
				proposal={BASE_PROPOSAL}
				onAccept={vi.fn()}
				onDecline={vi.fn()}
				onRetry={vi.fn()}
				onClose={vi.fn()}
				onEditText={vi.fn()}
			/>
		)

		expect(screen.getByText('Thinking…')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Keep both' })).toBeDisabled()
	})

	it('shows the streamed text as editable, and enables accept, retry and close once done', () => {
		render(
			<AskProposalWidget
				proposal={{ ...BASE_PROPOSAL, status: 'done', text: 'Hi world' }}
				onAccept={vi.fn()}
				onDecline={vi.fn()}
				onRetry={vi.fn()}
				onClose={vi.fn()}
				onEditText={vi.fn()}
			/>
		)

		expect(screen.getByRole('textbox')).toHaveValue('Hi world')
		expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled()
		expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
		expect(screen.getByRole('button', { name: 'Keep both' })).toBeEnabled()
	})

	it('shows the error message on failure', () => {
		render(
			<AskProposalWidget
				proposal={{
					...BASE_PROPOSAL,
					status: 'error',
					error: 'Claude CLI not found',
				}}
				onAccept={vi.fn()}
				onDecline={vi.fn()}
				onRetry={vi.fn()}
				onClose={vi.fn()}
				onEditText={vi.fn()}
			/>
		)

		expect(screen.getByText(/Claude CLI not found/)).toBeInTheDocument()
	})

	it('calls onEditText as the user edits the proposed text', async () => {
		const user = userEvent.setup()
		const onEditText = vi.fn()
		render(
			<AskProposalWidget
				proposal={{ ...BASE_PROPOSAL, status: 'done', text: 'Hi world' }}
				onAccept={vi.fn()}
				onDecline={vi.fn()}
				onRetry={vi.fn()}
				onClose={vi.fn()}
				onEditText={onEditText}
			/>
		)

		await user.type(screen.getByRole('textbox'), '!')

		expect(onEditText).toHaveBeenLastCalledWith('Hi world!')
	})

	it('calls onAccept, onDecline, onRetry and onClose when clicked', async () => {
		const user = userEvent.setup()
		const onAccept = vi.fn()
		const onDecline = vi.fn()
		const onRetry = vi.fn()
		const onClose = vi.fn()
		render(
			<AskProposalWidget
				proposal={{ ...BASE_PROPOSAL, status: 'done', text: 'Hi world' }}
				onAccept={onAccept}
				onDecline={onDecline}
				onRetry={onRetry}
				onClose={onClose}
				onEditText={vi.fn()}
			/>
		)

		await user.click(screen.getByRole('button', { name: 'Accept' }))
		await user.click(screen.getByRole('button', { name: 'Decline' }))
		await user.click(screen.getByRole('button', { name: 'Retry' }))
		await user.click(screen.getByRole('button', { name: 'Keep both' }))

		expect(onAccept).toHaveBeenCalledTimes(1)
		expect(onDecline).toHaveBeenCalledTimes(1)
		expect(onRetry).toHaveBeenCalledTimes(1)
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
