import type { Meta, StoryObj } from '@storybook/react-vite'

import Layout from '@/layout'

const meta = {
	component: Layout,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultFileName: 'notes.md',
	},
}
