import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

const meta = {
	component: Tooltip,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultOpen: true,
		children: (
			<>
				<TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
				<TooltipContent>Copy</TooltipContent>
			</>
		),
	},
}
