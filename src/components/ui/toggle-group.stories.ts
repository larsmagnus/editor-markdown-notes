import type { Meta, StoryObj } from '@storybook/react-vite'

import { ToggleGroup } from './toggle-group'

const meta = {
	component: ToggleGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		type: 'single',
	},
}
