import type { Meta, StoryObj } from '@storybook/react-vite'

import { AppErrorBoundary } from '@/components/app-error-boundary'

/** Stands in for a subtree that throws on render, the case the boundary exists for. */
function BrokenSubtree(): never {
	throw new Error('Cannot read properties of undefined (reading “nodeAt”)')
}

function WorkingSubtree() {
	return <p>The note renders here.</p>
}

const meta = {
	component: AppErrorBoundary,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof AppErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing threw, so the boundary is invisible and passes its child through. */
export const Primary: Story = {
	args: {
		title: 'The editor',
		children: <WorkingSubtree />,
	},
}

/**
 * The whole document failing. The toolbar lives outside this boundary, so raw
 * mode stays reachable as the escape hatch for a note that will not parse.
 */
export const EditorFailed: Story = {
	args: {
		title: 'The editor',
		children: <BrokenSubtree />,
	},
}

/**
 * A single node view failing. TipTap mounts each one as its own React root,
 * which is what lets one bad diagram degrade without taking the note with it.
 */
export const DiagramFailed: Story = {
	args: {
		title: 'This diagram',
		children: <BrokenSubtree />,
	},
}

export const WritingToolsFailed: Story = {
	args: {
		title: 'The writing tools',
		children: <BrokenSubtree />,
	},
}

export const ToolbarFailed: Story = {
	args: {
		title: 'The toolbar',
		children: <BrokenSubtree />,
	},
}
