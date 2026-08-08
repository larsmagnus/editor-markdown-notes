import type { Meta, StoryObj } from '@storybook/react-vite'

import Content from './content'

const meta = {
	component: Content,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Content>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultFileName: 'notes.md',
	},
}
