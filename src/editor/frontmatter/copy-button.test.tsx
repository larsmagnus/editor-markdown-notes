import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { FrontmatterCopyButton } from '@/editor/frontmatter/copy-button'
import { copyToClipboard } from '@/lib/clipboard'

// Mocked at the module rather than at `navigator`, which is the app's one seam
// onto the clipboard. Tolerating a missing clipboard is that module's job and
// is tested there.
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

afterEach(() => {
	vi.clearAllMocks()
})

describe('FrontmatterCopyButton', () => {
	it('should copy the frontmatter text to the clipboard when clicked', async () => {
		render(
			<TooltipProvider>
				<FrontmatterCopyButton frontmatter="title: Roadmap" />
			</TooltipProvider>
		)
		await userEvent.click(screen.getByLabelText('Copy frontmatter'))

		expect(copyToClipboard).toHaveBeenCalledWith('title: Roadmap')
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
})
