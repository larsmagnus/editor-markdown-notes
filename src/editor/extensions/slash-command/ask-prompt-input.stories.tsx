import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AskPromptInput } from '@/editor/extensions/slash-command/ask-prompt-input'

const meta = {
	component: AskPromptInput,
	parameters: {
		layout: 'centered',
	},
	args: {
		onSubmit: fn(),
		onCancel: fn(),
	},
} satisfies Meta<typeof AskPromptInput>

export default meta
type Story = StoryObj<typeof meta>

/** A prompt already typed - the Ask button is enabled, submittable by click or Enter. */
export const Primary: Story = {
	args: {
		defaultValue: 'Summarise this note',
	},
}

/** What `/ask` actually opens at the cursor: a free-text box, focused and empty - the Ask button stays disabled until something is typed. */
export const Disabled: Story = {
	args: {},
}
