import type { Meta, StoryObj } from '@storybook/react-vite'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from './dialog'

const meta = {
	component: Dialog,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		defaultOpen: true,
		children: (
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit note</DialogTitle>
					<DialogDescription>Make changes to your note here.</DialogDescription>
				</DialogHeader>
			</DialogContent>
		),
	},
}
