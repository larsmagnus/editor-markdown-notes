import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#src/components/ui/tooltip'
import { ImageToolbar } from '#src/editor/extensions/image/toolbar'

function renderToolbar(copyAsMermaid?: {
	copied: boolean
	onCopy: () => void
}) {
	render(
		<TooltipProvider>
			<ImageToolbar
				onEditSource={vi.fn()}
				onDelete={vi.fn()}
				copy={{ copied: false, onCopy: vi.fn() }}
				copyAsMermaid={copyAsMermaid}
				link={{
					linked: false,
					href: '',
					setLink: vi.fn(),
					unsetLink: vi.fn(),
				}}
				visible
			/>
		</TooltipProvider>
	)
}

describe('ImageToolbar', () => {
	it('offers "Copy as Mermaid" for a draw.io diagram', () => {
		renderToolbar({ copied: false, onCopy: vi.fn() })

		expect(screen.getByLabelText('Copy as Mermaid')).toBeTruthy()
	})

	it('leaves it out for an ordinary image', () => {
		renderToolbar()

		expect(screen.queryByLabelText('Copy as Mermaid')).toBeNull()
	})
})
