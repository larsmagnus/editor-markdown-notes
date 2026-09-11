import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#src/components/ui/tooltip'
import { MermaidToolbar } from '#src/editor/extensions/mermaid/toolbar'

const DIAGRAM_CODE = 'flowchart LR\n  A[Start] --> B[Ship it]'
const DIAGRAM_SVG = '<svg aria-roledescription="flowchart-v2"></svg>'

let mockScale = 1

vi.mock('react-zoom-pan-pinch', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-zoom-pan-pinch')>()
	return {
		...actual,
		useControls: () => ({
			zoomIn: vi.fn(),
			zoomOut: vi.fn(),
			resetTransform: vi.fn(),
		}),
		useTransformComponent: () => mockScale,
	}
})

function renderToolbarAtScale(scale: number) {
	mockScale = scale
	return render(
		<TooltipProvider>
			<MermaidToolbar code={DIAGRAM_CODE} svg={DIAGRAM_SVG} onEdit={() => {}} />
		</TooltipProvider>
	)
}

describe('MermaidToolbar', () => {
	it('disables reset but allows zooming further out at the starting scale', () => {
		renderToolbarAtScale(1)

		expect(screen.getByLabelText('Zoom out')).toBeEnabled()
		expect(screen.getByLabelText('Reset zoom')).toBeDisabled()
	})

	it('enables zoom out and reset once zoomed in past the starting scale', () => {
		renderToolbarAtScale(2)

		expect(screen.getByLabelText('Zoom out')).toBeEnabled()
		expect(screen.getByLabelText('Reset zoom')).toBeEnabled()
	})

	it('disables zoom out once the minimum scale is reached, but keeps reset enabled', () => {
		renderToolbarAtScale(0.5)

		expect(screen.getByLabelText('Zoom out')).toBeDisabled()
		expect(screen.getByLabelText('Reset zoom')).toBeEnabled()
	})
})
