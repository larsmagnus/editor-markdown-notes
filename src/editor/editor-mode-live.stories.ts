import type { Meta, StoryObj } from '@storybook/react-vite'

import EditorModeLive from '#src/editor/editor-mode-live'

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
		includeTypesetClassNames: true,
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
		includeTypesetClassNames: true,
	},
}

/** Every GFM alert kind; the tag line shows as text only while the caret is on it. */
export const Admonitions: Story = {
	args: {
		content: [
			'> [!NOTE]',
			'> Useful information that readers should take into account.',
			'',
			'> [!TIP]',
			'> Helpful advice for doing things better.',
			'',
			'> [!IMPORTANT]',
			'> Key information users need to know.',
			'',
			'> [!WARNING]',
			'> Urgent info that needs immediate attention.',
			'',
			'> [!CAUTION]',
			'> Advises about risks or negative outcomes.',
		].join('\n'),
		showMenu: true,
		includeTypesetClassNames: true,
	},
}
