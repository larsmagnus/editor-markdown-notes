import type { Meta, StoryObj } from '@storybook/react-vite'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'

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
		value: ['bold'],
		children: (
			<>
				<ToggleGroupItem value="bold">Bold</ToggleGroupItem>
				<ToggleGroupItem value="italic">Italic</ToggleGroupItem>
			</>
		),
	},
}
