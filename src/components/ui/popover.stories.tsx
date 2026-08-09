import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const meta = {
	component: Popover,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultOpen: true,
		children: (
			<>
				<PopoverTrigger asChild>
					<Button variant="outline">Open</Button>
				</PopoverTrigger>
				<PopoverContent>Popover content goes here.</PopoverContent>
			</>
		),
	},
}
