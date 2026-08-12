import type { Meta, StoryObj } from '@storybook/react-vite'

import { TooltipProvider } from '@/components/ui/tooltip'

import { FrontmatterCopyButton } from './copy-button'

const meta = {
	component: FrontmatterCopyButton,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof FrontmatterCopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: { frontmatter: 'title: Roadmap\nstatus: draft' },
}
