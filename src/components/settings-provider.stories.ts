import type { Meta, StoryObj } from '@storybook/react-vite'

import { SettingsProvider } from './settings-provider'

const meta = {
	component: SettingsProvider,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof SettingsProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
