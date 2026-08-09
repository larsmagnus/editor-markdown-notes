import type { Meta, StoryObj } from '@storybook/react-vite'

import { TooltipProvider } from '@/components/ui/tooltip'

import { CodeBlockCopyButton } from './code-block-copy-button'

const meta = {
	component: CodeBlockCopyButton,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof CodeBlockCopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: { code: 'const x = 1' },
}
