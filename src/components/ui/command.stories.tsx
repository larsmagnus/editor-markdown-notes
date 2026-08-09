import type { Meta, StoryObj } from '@storybook/react-vite'

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command'

const meta = {
	component: Command,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: (
			<>
				<CommandInput placeholder="Search files..." />
				<CommandList>
					<CommandEmpty>No file found.</CommandEmpty>
					<CommandGroup>
						<CommandItem>notes.md</CommandItem>
						<CommandItem>todo.md</CommandItem>
					</CommandGroup>
				</CommandList>
			</>
		),
	},
}
