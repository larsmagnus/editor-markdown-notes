import type { Meta, StoryObj } from '@storybook/react-vite'

import ThemeToggle from '@/components/theme-toggle'

const meta = {
	component: ThemeToggle,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
