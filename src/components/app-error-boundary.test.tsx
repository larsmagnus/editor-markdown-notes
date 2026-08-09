import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from '@/components/app-error-boundary'

/**
 * A component that throws until it is told to stop, so a boundary reset has
 * something different to render the second time around.
 */
let shouldThrow = true

function Diagram() {
	if (shouldThrow) throw new Error('Parse error on line 1')

	return <p>A working diagram</p>
}

beforeEach(() => {
	shouldThrow = true
	// React logs every caught error itself, which would drown the assertions and
	// fill the test output with stack traces that are the point of the test.
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
	vi.restoreAllMocks()
})

describe('AppErrorBoundary', () => {
	it('shows what broke and why instead of taking the page down', () => {
		render(
			<AppErrorBoundary title="This diagram">
				<Diagram />
			</AppErrorBoundary>
		)

		const fallback = screen.getByRole('alert')
		expect(fallback).toHaveTextContent('This diagram stopped working')
		expect(fallback).toHaveTextContent('Parse error on line 1')
	})

	it('leaves the rest of the page mounted', () => {
		render(
			<div>
				<p>The toolbar</p>
				<AppErrorBoundary title="The editor">
					<Diagram />
				</AppErrorBoundary>
			</div>
		)

		expect(screen.getByText('The toolbar')).toBeInTheDocument()
	})

	// The log bridge forwards `console.error` to the extension's output channel,
	// and its startup watchdog only fires while `#root` is empty - which a
	// rendered fallback is not. Reporting here is the only trace a contained
	// failure leaves.
	it('reports the error so it reaches the log channel', () => {
		render(
			<AppErrorBoundary title="The editor">
				<Diagram />
			</AppErrorBoundary>
		)

		expect(console.error).toHaveBeenCalledWith(
			'Uncaught error in the webview:',
			expect.objectContaining({ message: 'Parse error on line 1' }),
			expect.any(String)
		)
	})

	it('retries the subtree when asked to try again', async () => {
		render(
			<AppErrorBoundary title="This diagram">
				<Diagram />
			</AppErrorBoundary>
		)

		shouldThrow = false
		await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

		expect(screen.getByText('A working diagram')).toBeInTheDocument()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	// Switching notes is the common case: a document that would not parse leaves
	// a fallback that must not outlive the document that caused it.
	it('clears itself when a reset key changes', () => {
		const { rerender } = render(
			<AppErrorBoundary title="The editor" resetKeys={['notes.md']}>
				<Diagram />
			</AppErrorBoundary>
		)

		expect(screen.getByRole('alert')).toBeInTheDocument()

		shouldThrow = false
		rerender(
			<AppErrorBoundary title="The editor" resetKeys={['other-note.md']}>
				<Diagram />
			</AppErrorBoundary>
		)

		expect(screen.getByText('A working diagram')).toBeInTheDocument()
	})
})
