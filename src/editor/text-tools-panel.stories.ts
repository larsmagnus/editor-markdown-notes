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
		spellingLanguage: 'en-US',
		setSpellingLanguage: fn(),
		hasSpellingFailed: false,
	},
}

export const Analyzing: Story = {
	args: {
		analysis: {
			issues: [],
			sentenceCount: 5,
		},
		isAnalyzing: true,
		rules: [],
		setRules: fn(),
		spellingLanguage: 'en-US',
		setSpellingLanguage: fn(),
		hasSpellingFailed: false,
	},
}

export const Suggestion: Story = {
	args: {
		analysis: {
			issues: [
				{
					ruleId: 'passive',
					severity: 'hard',
					message: 'asd',
					actual: 'asd',
					expected: [''],
					start: 1,
					end: 2,
				},
			],
			sentenceCount: 5,
		},
		isAnalyzing: false,
		rules: ['passive'],
		setRules: fn(),
		spellingLanguage: 'en-US',
		setSpellingLanguage: fn(),
		hasSpellingFailed: false,
	},
}

export const Suggestions: Story = {
	args: {
		analysis: {
			issues: [
				{
					ruleId: 'passive',
					severity: 'hard',
					message: 'asd',
					actual: 'asd',
					expected: [''],
					start: 1,
					end: 2,
				},
				{
					ruleId: 'intensify',
					severity: 'hard',
					message: 'asd',
					actual: 'asd',
					expected: [''],
					start: 1,
					end: 2,
				},
			],
			sentenceCount: 5,
		},
		isAnalyzing: false,
		rules: ['passive', 'intensify'],
		setRules: fn(),
		spellingLanguage: 'en-US',
		setSpellingLanguage: fn(),
		hasSpellingFailed: false,
	},
}
