import type { Meta, StoryObj } from '@storybook/react-vite'

import Editor from './editor'

const meta = {
	component: Editor,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Editor>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: '# Hello\n\nSome **markdown** content.',
		showMenu: true,
		includeProseBaseClassNames: true,
	},
}
