import type { Meta, StoryObj } from '@storybook/react-vite'

import { Toggle } from './toggle'

const meta = {
	component: Toggle,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: 'Toggle',
	},
}
