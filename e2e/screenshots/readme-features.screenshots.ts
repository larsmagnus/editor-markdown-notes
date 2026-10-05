import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { selectSubstring } from '#e2e/lib/select-text'

const FIXTURE_NAME = 'markdown-notes-architect.md'
const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public')
const NOTE = readFileSync(path.join(PUBLIC_DIR, FIXTURE_NAME), 'utf8')

test.use({ deviceScaleFactor: 2 })

const viewOptions = {
	raw: false,
	fullWidth: true,
	theme: 'dark',
	textTools: false,
}

/** Shoots the dark editor as the webview host would boot it, since the Ask popover only exists there. */
async function openFixture(
	page: Page,
	overrides: Partial<typeof viewOptions> = {}
) {
	await page.setViewportSize({ width: 1100, height: 700 })
	await page.addInitScript(
		({ content, fileName, options }) => {
			window.vscode = {
				postMessage: () => {},
				getState: () => undefined,
				setState: () => {},
			}
			window.initialContent = content
			window.fileName = fileName
			window.initialConfig = JSON.parse(
				JSON.stringify({ viewOptions: options })
			)
		},
		{
			content: NOTE,
			fileName: FIXTURE_NAME,
			options: { ...viewOptions, ...overrides },
		}
	)
	await page.goto('/')
}

/** Spans can appear in batches, so one token is not proof the whole note is colored. */
const HIGHLIGHT_SETTLE_MS = 1000

/** Lets the popover finish fading in, so the shot is not caught half transparent. */
const POPOVER_ANIMATION_MS = 500

function centerInViewport(locator: Locator) {
	return locator.evaluate((element) =>
		element.scrollIntoView({ block: 'center' })
	)
}

function screenshotPath(name: string) {
	return path.join(PUBLIC_DIR, `screenshot-${name}.png`)
}

test('raw editor', async ({ page }) => {
	// Raw mode only loads the markdown and yaml grammars; fenced code gets its
	// colors only once the live editor has loaded that language, so the note
	// is opened live first and switched across once its code has colored.
	await openFixture(page)
	await expect(
		page.locator('.ProseMirror pre span[style*="color"]').first()
	).toBeVisible()
	await page.getByRole('button', { name: 'Raw editor' }).click()
	await expect(
		page.getByRole('textbox', { name: 'Raw markdown' })
	).toBeVisible()
	await expect(
		page
			.locator('pre[aria-hidden="true"] span[style*="color"]', {
				hasText: /^for$/,
			})
			.first()
	).toBeVisible()
	await page.waitForTimeout(HIGHLIGHT_SETTLE_MS)
	await page.screenshot({ path: screenshotPath('raw-editor') })
})

test('visual mermaid editing', async ({ page }) => {
	await openFixture(page)
	await page
		.getByRole('button', { name: 'Edit diagram visually' })
		.nth(1)
		.click()
	const canvas = page.getByTestId('mermaid-visual-canvas')
	await expect(canvas.locator('svg .node').first()).toBeVisible()
	await centerInViewport(canvas)
	await page.screenshot({ path: screenshotPath('mermaid-visual-editing') })
})

test('ask claude popover', async ({ page }) => {
	await openFixture(page)
	const paragraph = page
		.locator('.ProseMirror p', { hasText: 'Your job is to catch' })
		.first()
	await centerInViewport(paragraph)
	await selectSubstring(paragraph, 'a ProseMirror node with no matching')
	await page.getByRole('button', { name: 'Ask Claude' }).click()
	await expect(page.getByPlaceholder('Or ask something else…')).toBeVisible()
	await page.waitForTimeout(POPOVER_ANIMATION_MS)
	await page.screenshot({ path: screenshotPath('ask-claude') })
})
