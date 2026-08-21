import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'

import { extensions } from '@/editor/extensions/extensions'

type FrontmatterViewPreviewProps = { content: string }

/**
 * Mounts a real editor so `FrontmatterView` renders through the same node
 * view production uses - `NodeViewProps` come from TipTap itself and cannot
 * be built by hand.
 *
 * Loaded via `setContent` in `onCreate` rather than the `content` option:
 * only `setContent` runs the transaction pipeline `extension.ts`'s detection
 * plugin hooks into, the same distinction `markdown-round-trip.test.ts`'s
 * `roundTrip` helper calls out - constructing with `content` builds the
 * state directly and skips it, so the `---`/content/`---` pattern below would
 * stay raw `horizontalRule` nodes instead of promoting to the real node.
 */
function FrontmatterViewPreview({ content }: FrontmatterViewPreviewProps) {
	const editor = useEditor({
		extensions,
		content: '',
		onCreate: ({ editor }) => editor.commands.setContent(content),
	})

	if (!editor) return null

	return <EditorContent editor={editor} />
}

const meta = {
	component: FrontmatterViewPreview,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof FrontmatterViewPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: [
			'---',
			'',
			'title: Roadmap',
			'status: draft',
			'',
			'---',
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n'),
	},
}

export const Empty: Story = {
	args: {
		content: ['---', '', '---', '', '# Roadmap'].join('\n'),
	},
}
