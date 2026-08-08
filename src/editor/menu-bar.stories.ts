import type { Meta, StoryObj } from '@storybook/react-vite'

import { MenuBar } from './menu-bar'

const meta = {
	component: MenuBar,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof MenuBar>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
