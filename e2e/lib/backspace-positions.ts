import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

import { pressKeySettled } from '@/e2e/lib/press-key-settled'

/** Clicks into `text`, then backspaces right at its end. */
export async function backspaceAtEndOf(page: Page, text: string) {
	const content = page.getByRole('textbox').first()
	await content.getByText(text).click()
	await expect(content).toBeFocused()
	await pressKeySettled(page, 'End')
	await pressKeySettled(page, 'Backspace')
}

/** Clicks into `text`, `Home`s to its start, then backspaces `steps` in. */
export async function backspaceIntoStartOf(
	page: Page,
	text: string,
	steps: number
) {
	const content = page.getByRole('textbox').first()
	await content.getByText(text).click()
	await expect(content).toBeFocused()
	await pressKeySettled(page, 'Home')
	for (let index = 0; index < steps; index += 1) {
		await pressKeySettled(page, 'ArrowRight')
	}
	await pressKeySettled(page, 'Backspace')
}
