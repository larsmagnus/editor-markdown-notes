import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonColor } from './button-color'

const meta = {
	component: ButtonColor,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonColor>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		color: '#e11d48',
	},
}
