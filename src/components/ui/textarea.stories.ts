import type { Meta, StoryObj } from '@storybook/react-vite'

import { Textarea } from './textarea'

const meta = {
	component: Textarea,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
