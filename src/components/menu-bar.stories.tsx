import type { Meta, StoryObj } from '@storybook/react-vite'

import { MenuBar } from '@/components/menu-bar'
import { EditorContextDecorator } from '@/storybook/decorator-editor-context'

const meta = {
	component: MenuBar,
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
} satisfies Meta<typeof MenuBar>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
