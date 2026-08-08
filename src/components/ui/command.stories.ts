import type { Meta, StoryObj } from '@storybook/react-vite'

import { Command } from './command'

const meta = {
	component: Command,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
