import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#src/components/ui/popover'
import { getPageFocusableElements } from '#src/editor/extensions/focus-navigation/focusable-elements'

describe('getPageFocusableElements', () => {
	it('collects the buttons on the page', () => {
		render(
			<div>
				<button type="button">Copy page</button>
				<button type="button">Toggle raw</button>
			</div>
		)

		expect(
			getPageFocusableElements().map((element) => element.textContent)
		).toEqual(['Copy page', 'Toggle raw'])
	})

	it('leaves out anything inside an open overlay, which runs its own focus order', async () => {
		render(
			<div>
				<button type="button">Copy page</button>
				<Popover open>
					<PopoverTrigger>Edit link</PopoverTrigger>
					<PopoverContent>
						<button type="button">Remove link</button>
					</PopoverContent>
				</Popover>
			</div>
		)
		await screen.findByRole('button', { name: 'Remove link' })

		expect(
			getPageFocusableElements().map((element) => element.textContent)
		).toEqual(['Copy page', 'Edit link'])
	})
})
