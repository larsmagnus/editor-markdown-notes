import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ButtonCopy } from '@/components/button-copy'
import { TooltipProvider } from '@/components/ui/tooltip'

const meta = {
	component: ButtonCopy,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof ButtonCopy>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: { label: 'Copy frontmatter', copied: false, onClick: () => {} },
	render: function Render(args) {
		const [copied, setCopied] = useState(false)
		return (
			<ButtonCopy {...args} copied={copied} onClick={() => setCopied(true)} />
		)
	},
}
