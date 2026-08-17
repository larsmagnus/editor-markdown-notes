import type { Meta, StoryObj } from '@storybook/react-vite'

import { EditorContextMount } from '@/editor/editor-context-decorator'

import { AskPopover } from './ask-popover'

const meta = {
	component: AskPopover,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<EditorContextMount>
				<Story />
			</EditorContextMount>
		),
	],
} satisfies Meta<typeof AskPopover>

export default meta
type Story = StoryObj<typeof meta>

/** The bubble menu's sparkles trigger, closed. */
export const Primary: Story = {
	args: {},
}
