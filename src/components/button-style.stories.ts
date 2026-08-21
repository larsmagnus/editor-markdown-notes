import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonStyle } from '@/components/button-style'

const meta = {
	component: ButtonStyle,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonStyle>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		style: 'bold',
	},
}
