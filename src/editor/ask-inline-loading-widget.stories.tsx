import type { Meta, StoryObj } from '@storybook/react-vite'

import { AskInlineLoadingWidget } from './ask-inline-loading-widget'

const meta = {
	component: AskInlineLoadingWidget,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof AskInlineLoadingWidget>

export default meta
type Story = StoryObj<typeof meta>

/** What `/ask` shows at the cursor while it waits for the first streamed chunk. */
export const Primary: Story = {
	args: {},
}
