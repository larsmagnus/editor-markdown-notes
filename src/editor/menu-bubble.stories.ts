import type { Meta, StoryObj } from '@storybook/react-vite'

import { MenuBubble } from './menu-bubble'

const meta = {
	component: MenuBubble,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof MenuBubble>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
