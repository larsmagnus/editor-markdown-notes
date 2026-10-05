import { render, renderHook, screen, waitFor } from '@testing-library/react'
import type { Editor } from '@tiptap/react'
import { ErrorBoundary } from 'react-error-boundary'
import { describe, expect, it, vi } from 'vitest'

import { mountVisimer } from '#src/editor/extensions/mermaid/visual-editor/mount-visimer'
import { useVisimerCanvas } from '#src/hooks/use-visimer-canvas'

vi.mock('#src/hooks/use-is-dark', () => ({ useIsDark: () => false }))
vi.mock('#src/editor/extensions/mermaid/visual-editor/mount-visimer')

const mockedMount = vi.mocked(mountVisimer)

function hookOptions() {
	const frame = document.createElement('div')
	const canvas = document.createElement('div')
	frame.append(canvas)
	const frameRef = { current: frame }

	return {
		editor: {} as Editor,
		getPos: () => 0,
		code: 'graph TD\n  A --> B',
		frameRef,
		canvas,
	}
}

function mountedVisimer() {
	return {
		view: {} as Awaited<ReturnType<typeof mountVisimer>>['view'],
		wysiwyg: { code: 'graph TD\n  A --> B' } as Awaited<
			ReturnType<typeof mountVisimer>
		>['wysiwyg'],
		destroy: vi.fn(),
	}
}

function CanvasThatCannotStart() {
	const { canvasRef } = useVisimerCanvas({
		...hookOptions(),
		frameRef: { current: document.createElement('div') },
	})

	return <div ref={canvasRef} />
}

describe('useVisimerCanvas', () => {
	it('lets the surrounding boundary report a canvas that could not start', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		mockedMount.mockRejectedValue(new Error('the canvas could not start'))

		render(
			<ErrorBoundary fallback={<p>The diagram editor stopped working</p>}>
				<CanvasThatCannotStart />
			</ErrorBoundary>
		)

		expect(
			await screen.findByText('The diagram editor stopped working')
		).toBeVisible()
	})

	// Toolbar actions read these, and the next canvas is a dynamic import away.
	it('lets go of a canvas it has torn down', async () => {
		const mounted = mountedVisimer()
		mockedMount.mockResolvedValue(mounted)
		const { canvas, ...options } = hookOptions()
		const { result, unmount } = renderHook(() => {
			const hook = useVisimerCanvas(options)
			// The hook's own ref is what the app attaches to a real element.
			hook.canvasRef.current = canvas
			return hook
		})
		await waitFor(() => expect(result.current.view.current).toBe(mounted.view))

		unmount()

		expect(mounted.destroy).toHaveBeenCalledOnce()
		expect(result.current.view.current).toBeUndefined()
		expect(result.current.wysiwyg.current).toBeUndefined()
	})
})
