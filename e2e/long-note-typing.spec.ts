import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import type { Page } from '@playwright/test'

import { expect, test } from '#e2e/lib/fixtures'
import { openInVSCode } from '#e2e/lib/vscode-host'

const CORPUS = 'fixtures/markdown/adversarial'

/** Every adversarial note, over and over, to a note of more than five thousand lines. */
function longNote(): string {
	const corpus = readdirSync(CORPUS)
		.filter((name) => name.endsWith('.md'))
		.map((name) => readFileSync(join(CORPUS, name), 'utf8'))
		.join('\n\n')
	return `# Long note\n\nType here.\n\n${Array.from({ length: 20 }, () => corpus).join('\n\n')}`
}

const TYPED = 'Ship it today, then review.'

/** Milliseconds the page may spend handling one keystroke before typing feels slow. */
const BUDGET_MS = 50

/**
 * Starts recording how long the page spends handling each keystroke - the
 * Event Timing API's processing time, which leaves out the test runner's own
 * round trips and so holds steady when other specs share the machine.
 */
async function recordKeystrokes(page: Page) {
	await page.evaluate(() => {
		const durations: number[] = []
		Object.assign(window, { keystrokeDurations: durations })
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as PerformanceEventTiming[]) {
				if (entry.name === 'keydown' || entry.name === 'input') {
					durations.push(entry.processingEnd - entry.processingStart)
				}
			}
		}).observe({
			type: 'event',
			durationThreshold: 16,
		} as PerformanceObserverInit)
	})
}

/** The slowest keystroke but one - a single stall is not what makes typing feel slow. */
async function typicalSlowKeystroke(page: Page): Promise<number> {
	const durations = await page.evaluate(() =>
		[
			...(window as unknown as { keystrokeDurations: number[] })
				.keystrokeDurations,
		].sort((a, b) => b - a)
	)
	return durations[1] ?? durations[0] ?? 0
}

test.describe('Typing into a five-thousand-line note', () => {
	test('keeps up in the live editor', async ({ page }) => {
		await openInVSCode(page, longNote())
		const content = page.getByRole('textbox').first()
		await content.getByText('Type here.').click()
		await page.keyboard.press('End')
		await recordKeystrokes(page)

		await page.keyboard.type(TYPED)
		await expect(content).toContainText(`Type here.${TYPED}`)

		expect(await typicalSlowKeystroke(page)).toBeLessThan(BUDGET_MS)
	})

	test('keeps up in the raw editor', async ({ page }) => {
		await openInVSCode(page, longNote())
		await page.getByRole('button', { name: 'Raw editor' }).click()
		const raw = page.getByRole('textbox', { name: 'Raw markdown' })
		await raw.evaluate((element: HTMLTextAreaElement) => {
			const end = element.value.indexOf('Type here.') + 'Type here.'.length
			element.focus()
			element.setSelectionRange(end, end)
		})
		await recordKeystrokes(page)

		await page.keyboard.type(TYPED)
		await expect(raw).toHaveValue(new RegExp(`Type here\\.${TYPED}`))

		expect(await typicalSlowKeystroke(page)).toBeLessThan(BUDGET_MS)
	})
})
