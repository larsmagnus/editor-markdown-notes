import type { Meta, StoryObj } from '@storybook/react-vite'

import Header from '@/components/header'

const meta = {
	component: Header,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		level: 1,
		children: 'Heading',
	},
}
