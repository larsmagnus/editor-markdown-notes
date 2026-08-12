import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import Toolbar from './toolbar'

const meta = {
	component: Toolbar,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		files: [],
		fileName: 'asd',
		setFileName: fn(),
		content: '# Roadmap\n\nShip it.',
	},
}
