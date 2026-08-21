import type { Meta, StoryObj } from '@storybook/react-vite'

import { AskPopover } from '@/editor/extensions/ask/ask-popover'
import { EditorContextDecorator } from '@/storybook/decorator-editor-context'

const meta = {
	component: AskPopover,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<EditorContextDecorator>
				<Story />
			</EditorContextDecorator>
		),
	],
} satisfies Meta<typeof AskPopover>

export default meta
type Story = StoryObj<typeof meta>

/** The bubble menu's sparkles trigger, closed. */
export const Primary: Story = {
	args: {},
}
