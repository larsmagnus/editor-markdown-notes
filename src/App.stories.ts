import type { Meta, StoryObj } from '@storybook/react-vite'

import App from './App'

const meta = {
	component: App,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
