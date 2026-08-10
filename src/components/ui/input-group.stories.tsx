import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchIcon } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'

const meta = {
	component: InputGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		className: 'w-[240px]',
		children: (
			<>
				<InputGroupInput placeholder="Search files..." />
				<InputGroupAddon>
					<SearchIcon className="size-4 shrink-0 opacity-50" />
				</InputGroupAddon>
			</>
		),
	},
}
