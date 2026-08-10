import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './dropdown-menu'

const meta = {
	component: DropdownMenu,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultOpen: true,
		children: (
			<>
				<DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
				<DropdownMenuContent>
					<DropdownMenuItem>Copy markdown</DropdownMenuItem>
					<DropdownMenuItem>Copy plain text</DropdownMenuItem>
				</DropdownMenuContent>
			</>
		),
	},
}
