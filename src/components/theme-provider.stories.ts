import type { Meta, StoryObj } from '@storybook/react-vite'

import { ThemeProvider } from './theme-provider'

const meta = {
	component: ThemeProvider,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
