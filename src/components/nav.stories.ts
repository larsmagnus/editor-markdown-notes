import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import Nav from './nav'

const meta = {
	component: Nav,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Nav>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		files: [],
		fileName: 'asd',
		setFileName: fn(),
	},
}
