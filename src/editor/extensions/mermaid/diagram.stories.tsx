import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorContent, useEditor } from '@tiptap/react'

import { extensions } from '@/editor/extensions/extensions'

type MermaidDiagramPreviewProps = { content: string }

/**
 * Mounts a real editor on a single fenced `mermaid` block, so `MermaidDiagram`
 * renders through the same `CodeBlockView` node view production uses -
 * `NodeViewProps` come from TipTap itself and cannot be built by hand.
 * `component` targets this wrapper rather than `MermaidDiagram` directly for
 * the same reason: its own props are that same TipTap-only-constructible
 * shape.
 */
function MermaidDiagramPreview({ content }: MermaidDiagramPreviewProps) {
	const editor = useEditor({ extensions, content })

	if (!editor) return null

	return <EditorContent editor={editor} />
}

const meta = {
	component: MermaidDiagramPreview,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof MermaidDiagramPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: [
			'```mermaid',
			'flowchart LR',
			'  A[Start] --> B[Do the thing]',
			'  B --> C[Done]',
			'```',
		].join('\n'),
	},
}

export const Error: Story = {
	args: {
		content: [
			'```mermaid',
			'flowchart LR',
			'  A -->|writes| ((unclosed',
			'```',
		].join('\n'),
	},
}
