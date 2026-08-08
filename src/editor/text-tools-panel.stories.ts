import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { TextToolsPanel } from './text-tools-panel'

const meta = {
	component: TextToolsPanel,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof TextToolsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		analysis: {
			issues: [],
			sentenceCount: 5,
		},
		isAnalyzing: false,
		rules: [],
		setRules: fn(),
	},
}
