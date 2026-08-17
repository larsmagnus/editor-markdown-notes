import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import type { AskProposalState } from '@/editor/ask-suggestion-extension'

import { AskProposalWidget } from './ask-proposal-widget'

const BASE_PROPOSAL: AskProposalState = {
	id: 'proposal-1',
	from: 1,
	to: 6,
	prompt: 'Shorten this',
	status: 'streaming',
	text: '',
}

const meta = {
	component: AskProposalWidget,
	parameters: {
		layout: 'centered',
	},
	args: {
		onAccept: fn(),
		onDecline: fn(),
		onRetry: fn(),
		onClose: fn(),
		onEditText: fn(),
	},
} satisfies Meta<typeof AskProposalWidget>

export default meta
type Story = StoryObj<typeof meta>

/** No text back yet - the spinner is the only sign anything is happening. */
export const Loading: Story = {
	args: {
		proposal: BASE_PROPOSAL,
	},
}

/** Text arriving mid-stream, before the reply is complete. */
export const Streaming: Story = {
	args: {
		proposal: { ...BASE_PROPOSAL, text: 'Hi wor' },
	},
}

/** Accept, Retry and the close X only enable once the reply has fully arrived - and only then is the text itself editable. */
export const Done: Story = {
	args: {
		proposal: { ...BASE_PROPOSAL, status: 'done', text: 'Hi world' },
	},
}

export const Error: Story = {
	args: {
		proposal: {
			...BASE_PROPOSAL,
			status: 'error',
			error: 'Claude CLI not found on PATH',
		},
	},
}
