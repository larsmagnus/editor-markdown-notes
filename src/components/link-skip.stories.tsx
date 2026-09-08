import type { Meta, StoryObj } from '@storybook/react-vite'

import LinkSkip from '#src/components/link-skip'

const meta = {
	component: LinkSkip,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof LinkSkip>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: 'Skip to main content',
		className: 'absolute top-2 left-2 focus:p-2 ring-2 ring-ring ring-blue-500',
		href: '#main',
	},
}
