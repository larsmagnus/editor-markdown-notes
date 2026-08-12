import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { FrontmatterCopyButton } from '@/editor/frontmatter/copy-button'

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('FrontmatterCopyButton', () => {
	it('should copy the frontmatter text to the clipboard when clicked', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', {
			...navigator,
			clipboard: { writeText },
		})

		render(
			<TooltipProvider>
				<FrontmatterCopyButton frontmatter="title: Roadmap" />
			</TooltipProvider>
		)
		await userEvent.click(screen.getByLabelText('Copy frontmatter'))

		expect(writeText).toHaveBeenCalledWith('title: Roadmap')
	})

	it('should show a "Copy" tooltip when hovering the button', async () => {
		render(
			<TooltipProvider>
				<FrontmatterCopyButton frontmatter="title: Roadmap" />
			</TooltipProvider>
		)

		await userEvent.hover(screen.getByLabelText('Copy frontmatter'))

		expect(await screen.findByText('Copy')).toBeInTheDocument()
	})

	it('should not throw when clicked without clipboard access', async () => {
		vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })

		render(
			<TooltipProvider>
				<FrontmatterCopyButton frontmatter="title: Roadmap" />
			</TooltipProvider>
		)

		await expect(
			userEvent.click(screen.getByLabelText('Copy frontmatter'))
		).resolves.not.toThrow()
	})
})
