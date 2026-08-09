import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

import { EditorContextMount } from './editor-context-decorator'
import { MenuBubble } from './menu-bubble'

const meta = {
	component: MenuBubble,
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
} satisfies Meta<typeof MenuBubble>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
	// `BubbleMenu` only renders while there is a non-empty selection, so the
	// story selects the sample text itself rather than showing an empty canvas.
	// TipTap's `selectAll` shortcut is bound to `Mod-a`, which prosemirror-keymap
	// resolves to Meta (Cmd) rather than Control on a Mac-reporting browser.
	async play({ canvasElement }) {
		const editor = within(canvasElement).getByRole('textbox')
		await userEvent.click(editor)
		const modifier = navigator.platform.toLowerCase().includes('mac')
			? 'Meta'
			: 'Control'
		await userEvent.keyboard(`{${modifier}>}a{/${modifier}}`)
	},
}
