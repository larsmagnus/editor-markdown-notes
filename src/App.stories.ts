import type { Meta, StoryObj } from '@storybook/react-vite'

import App from './App'

const meta = {
	component: App,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const LiveEditor: Story = {
	args: {
		initialViewOptions: { raw: false },
	},
}

export const RawEditor: Story = {
	args: {
		initialViewOptions: { raw: true },
	},
}

export const LiveEditorWithTextTools: Story = {
	args: {
		initialViewOptions: { textTools: true },
	},
}

export const LiveEditorFullWidth: Story = {
	args: {
		initialViewOptions: { fullWidth: true },
	},
}

export const LiveEditorFullWidthWithTextTools: Story = {
	args: {
		initialViewOptions: { fullWidth: true, textTools: true },
	},
}

/** `centerContent` is only ever set by VSCode, so this is Storybook's only way to show it. */
export const LiveEditorCenteredContent: Story = {
	args: {
		initialSettings: { centerContent: true },
	},
}

export const LiveEditorCenteredContentWithTextTools: Story = {
	args: {
		initialSettings: { centerContent: true },
		initialViewOptions: { textTools: true },
	},
}
