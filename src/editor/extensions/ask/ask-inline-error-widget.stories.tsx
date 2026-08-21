import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AskInlineErrorWidget } from '@/editor/extensions/ask/ask-inline-error-widget'

const meta = {
	component: AskInlineErrorWidget,
	parameters: {
		layout: 'centered',
	},
	args: {
		onRetry: fn(),
		onDismiss: fn(),
	},
} satisfies Meta<typeof AskInlineErrorWidget>

export default meta
type Story = StoryObj<typeof meta>

/** What `/ask` shows in place of the spinner once the request fails. */
export const Primary: Story = {
	args: {
		error: 'Claude CLI not found on PATH',
	},
}
