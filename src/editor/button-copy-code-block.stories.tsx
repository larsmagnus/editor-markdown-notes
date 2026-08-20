import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ButtonCopyCodeBlock } from '@/editor/button-copy-code-block'

const meta = {
	component: ButtonCopyCodeBlock,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<TooltipProvider>
				{/* Matches the `<pre className="group relative">` `code-block-view.tsx`
				    renders it inside - the button is invisible without it. */}
				<pre className="group relative">
					<Story />
				</pre>
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof ButtonCopyCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: { code: 'const x = 1' },
	// The button only shows on hover/focus, so the story hovers it itself
	// rather than shipping a permanently-visible button that misrepresents it.
	async play({ canvasElement }) {
		const button = within(canvasElement).getByRole('button')
		await userEvent.hover(button)
	},
}
