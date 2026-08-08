import type { Meta, StoryObj } from '@storybook/react-vite'

import { Popover } from './popover'

const meta = {
	component: Popover,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
