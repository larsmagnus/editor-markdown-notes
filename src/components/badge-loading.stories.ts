import type { Meta, StoryObj } from '@storybook/react-vite'

import { BadgeLoading } from '@/components/badge-loading'

const meta = {
	component: BadgeLoading,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof BadgeLoading>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: 'Asking Claude...',
	},
}
