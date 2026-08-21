import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonHeading } from '@/components/button-heading'

const meta = {
	component: ButtonHeading,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		level: 1,
	},
}
