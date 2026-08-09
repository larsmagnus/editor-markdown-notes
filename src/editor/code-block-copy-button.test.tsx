import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { CodeBlockCopyButton } from '@/editor/code-block-copy-button'

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('CodeBlockCopyButton', () => {
	it('should copy the code to the clipboard when clicked', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', {
			...navigator,
			clipboard: { writeText },
		})

		render(
			<TooltipProvider>
				<CodeBlockCopyButton code="const greeting = 'hello world'" />
			</TooltipProvider>
		)
		await userEvent.click(screen.getByLabelText('Copy code'))

		expect(writeText).toHaveBeenCalledWith("const greeting = 'hello world'")
	})

	it('should show a "Copy" tooltip when hovering the button', async () => {
		render(
			<TooltipProvider>
				<CodeBlockCopyButton code="const greeting = 'hello world'" />
			</TooltipProvider>
		)

		await userEvent.hover(screen.getByLabelText('Copy code'))

		expect(await screen.findByText('Copy')).toBeInTheDocument()
	})

	it('should not throw when clicked without clipboard access', async () => {
		vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })

		render(
			<TooltipProvider>
				<CodeBlockCopyButton code="const greeting = 'hello world'" />
			</TooltipProvider>
		)

		await expect(
			userEvent.click(screen.getByLabelText('Copy code'))
		).resolves.not.toThrow()
	})
})
