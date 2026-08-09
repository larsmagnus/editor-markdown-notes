import type { Meta, StoryObj } from '@storybook/react-vite'

import { EditorContextMount } from './editor-context-decorator'
import { MenuBar } from './menu-bar'

const meta = {
	component: MenuBar,
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
} satisfies Meta<typeof MenuBar>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
