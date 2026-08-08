import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './separator'

const meta = {
	component: Separator,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
