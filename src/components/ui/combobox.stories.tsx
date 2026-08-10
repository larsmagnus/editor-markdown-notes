import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from './combobox'

const FILES = [
	{ value: 'notes.md', label: 'notes.md' },
	{ value: 'todo.md', label: 'todo.md' },
]

const meta = {
	component: Combobox,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		items: FILES,
		defaultOpen: true,
		children: (
			<>
				<ComboboxTrigger
					render={
						<Button variant="outline" className="w-[200px] justify-between" />
					}
				>
					<ComboboxValue placeholder="Select file..." />
				</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxInput placeholder="Search files..." showTrigger={false} />
					<ComboboxEmpty>No file found.</ComboboxEmpty>
					<ComboboxList>
						{(item: (typeof FILES)[number]) => (
							<ComboboxItem key={item.value} value={item}>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</>
		),
	},
}
