import type { Meta, StoryObj } from '@storybook/react-vite'

import EditorModeLive from '@/editor/editor-mode-live'

const meta = {
	component: EditorModeLive,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof EditorModeLive>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		content: '# Hello\n\nSome **markdown** content.',
		showMenu: true,
		includeProseBaseClassNames: true,
	},
}

/**
 * A diagram that will not parse reports in place and keeps its source visible,
 * without involving an error boundary - mermaid hands back the reason rather
 * than throwing, and the source is the only way to fix it.
 */
export const DiagramThatWillNotParse: Story = {
	args: {
		content: [
			'# Hello',
			'',
			'```mermaid',
			'flowchart LR',
			'  A -->|writes| ((unclosed',
			'```',
			'',
			'The rest of the note keeps rendering.',
		].join('\n'),
		showMenu: true,
		includeProseBaseClassNames: true,
	},
}
