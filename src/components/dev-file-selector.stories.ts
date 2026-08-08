import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import DevFileSelector from './dev-file-selector'

const meta = {
	component: DevFileSelector,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof DevFileSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		value: 'notes',
		setValue: fn(),
		values: [
			{ value: 'notes', label: 'notes.md' },
			{ value: 'todo', label: 'todo.md' },
		],
	},
}
