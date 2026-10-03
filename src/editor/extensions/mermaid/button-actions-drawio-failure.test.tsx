import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '#src/components/settings-provider'
import { TooltipProvider } from '#src/components/ui/tooltip'
import { ButtonActions } from '#src/editor/extensions/mermaid/button-actions'
import { copyToClipboard } from '#src/lib/clipboard'

vi.mock('#src/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))
vi.mock('#src/editor/extensions/mermaid/drawio/svg-to-drawio', () => ({
	svgToDrawio: () => {
		throw new Error('unreadable diagram')
	},
}))

afterEach(() => {
	localStorage.clear()
	vi.restoreAllMocks()
	vi.clearAllMocks()
})

describe('ButtonActions draw.io failure', () => {
	it('reports the failure and leaves the clipboard and badge alone', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

		render(
			<SettingsProvider>
				<TooltipProvider>
					<ButtonActions
						code={'flowchart LR\n  A[Start] --> B[Ship it]'}
						svg="<svg></svg>"
					/>
				</TooltipProvider>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Diagram actions'))
		await userEvent.click(await screen.findByText('Copy as draw.io'))

		await waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				'Could not copy the diagram as draw.io:',
				expect.objectContaining({ message: 'unreadable diagram' })
			)
		)
		expect(copyToClipboard).not.toHaveBeenCalled()
		expect(screen.queryByRole('status')).toBeNull()
	})
})
