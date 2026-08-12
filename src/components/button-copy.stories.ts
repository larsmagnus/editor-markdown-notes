import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonCopy } from './button-copy'

const meta = {
	component: ButtonCopy,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonCopy>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: '---\ntitle: Roadmap\n---\n\n# Roadmap\n\nShip it.',
	},
}
