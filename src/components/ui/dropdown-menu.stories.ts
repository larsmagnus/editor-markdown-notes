import type { Meta, StoryObj } from '@storybook/react-vite'

import { DropdownMenu } from './dropdown-menu'

const meta = {
	component: DropdownMenu,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
