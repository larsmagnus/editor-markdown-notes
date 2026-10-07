import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

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

/** Milliseconds per keystroke a long note may take before typing feels slow. */
const BUDGET_MS = 50

test.describe('Typing into a five-thousand-line note', () => {
	test('keeps up in the live editor', async ({ page }) => {
		await openInVSCode(page, longNote())
		const content = page.getByRole('textbox').first()
		await content.getByText('Type here.').click()
		await page.keyboard.press('End')

		const started = Date.now()
		await page.keyboard.type(TYPED)
		await expect(content).toContainText(`Type here.${TYPED}`)
		const perKey = (Date.now() - started) / TYPED.length

		expect(perKey).toBeLessThan(BUDGET_MS)
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

		const started = Date.now()
		await page.keyboard.type(TYPED)
		await expect(raw).toHaveValue(new RegExp(`Type here\\.${TYPED}`))
		const perKey = (Date.now() - started) / TYPED.length

		expect(perKey).toBeLessThan(BUDGET_MS)
	})
})
