import type { Meta, StoryObj } from '@storybook/react-vite'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ButtonCopy } from '@/editor/frontmatter/button-copy'

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
	args: { frontmatter: 'title: Roadmap\nstatus: draft' },
}
