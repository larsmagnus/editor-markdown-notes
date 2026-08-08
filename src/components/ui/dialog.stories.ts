import type { Meta, StoryObj } from '@storybook/react-vite'

import { Dialog } from './dialog'

const meta = {
	component: Dialog,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
