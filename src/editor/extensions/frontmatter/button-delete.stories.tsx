import type { Meta, StoryObj } from '@storybook/react-vite'
import { Editor } from '@tiptap/react'

import { TooltipProvider } from '#src/components/ui/tooltip'
import { extensions } from '#src/editor/extensions/extensions'
import { ButtonDelete } from '#src/editor/extensions/frontmatter/button-delete'

const editor = new Editor({ extensions, content: '' })
editor.commands.insertContentAt(0, {
	type: 'frontmatter',
	content: [{ type: 'text', text: 'title: Roadmap' }],
})

const meta = {
	component: ButtonDelete,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof ButtonDelete>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: { editor, getPos: () => 0 },
}
