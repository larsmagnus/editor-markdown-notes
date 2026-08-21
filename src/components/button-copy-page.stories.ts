import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonCopyPage } from '@/components/button-copy-page'

const meta = {
	component: ButtonCopyPage,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonCopyPage>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: '---\ntitle: Roadmap\n---\n\n# Roadmap\n\nShip it.',
	},
}
