import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { ErrorFallback } from './error-fallback'

const meta = {
	component: ErrorFallback,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ErrorFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		title: 'The editor',
		error: new Error('Cannot read properties of undefined (reading “nodeAt”)'),
		resetErrorBoundary: fn(),
	},
}

/** One diagram failing, contained to its own block inside the document. */
export const Diagram: Story = {
	args: {
		title: 'This diagram',
		error: new Error(
			'Parse error on line 2: expected one of “graph”, “flowchart”'
		),
		resetErrorBoundary: fn(),
	},
}

export const WritingTools: Story = {
	args: {
		title: 'The writing tools',
		error: new Error('Failed to fetch dynamically imported module'),
		resetErrorBoundary: fn(),
	},
}

/**
 * A rejected promise can carry anything at all, so the fallback has to read
 * sensibly when what was thrown is not an `Error`.
 */
export const ThrownValueIsNotAnError: Story = {
	args: {
		title: 'The editor',
		error: 'worker exited before the analysis returned',
		resetErrorBoundary: fn(),
	},
}

/**
 * Stack-shaped messages are the realistic worst case for layout: the message
 * has to wrap inside the panel rather than push the note sideways.
 */
export const LongMessage: Story = {
	args: {
		title: 'The editor',
		error: new Error(
			'RangeError: Index 55 out of range for <heading("other-note.md"), paragraph("This is the companion fixture to notes.md"), codeBlock("flowchart LR")>'
		),
		resetErrorBoundary: fn(),
	},
}
