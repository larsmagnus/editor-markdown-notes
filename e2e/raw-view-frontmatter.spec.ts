import { readFileSync } from 'fs'

import { expect, test } from '@playwright/test'

/**
 * The real VS Code webview injects `window.vscode`/`window.initialContent`
 * before the bundle runs (`webview-html.ts`) - that is what puts the app on
 * the VS Code data path (`useHostDocument`) rather than the standalone demo
 * path (`useContent`, a `fetch()` against `public/`). A plain `pnpm dev`/`vite
 * preview` load never takes that branch, so reproducing a VS-Code-only bug
 * means seeding the same globals before navigation.
 */
test('switching from the live view to the raw view keeps the whole document visible', async ({
	page,
}) => {
	const content = readFileSync('public/notes.md', 'utf8')

	await page.addInitScript((initialContent) => {
		window.vscode = {
			postMessage: () => {},
			getState: () => undefined,
			setState: () => {},
		}
		window.initialContent = initialContent
		window.fileName = 'notes.md'
	}, content)

	await page.goto('/')

	await expect(
		page.getByRole('heading', { name: 'Editor Markdown Notes', level: 1 })
	).toBeVisible()

	await page.getByRole('button', { name: 'Raw editor' }).click()

	const raw = page.getByRole('textbox', { name: 'Raw markdown' })
	await expect(raw).toBeVisible()
	await expect(raw).toHaveValue(content)

	// The app has exactly one scroll container - the page itself
	// (`layout.tsx`) - so the raw textarea is meant to grow to fit its whole
	// content rather than scroll internally. A textarea left at its native
	// intrinsic height does neither: it renders about two rows tall
	// (`---` and the frontmatter's first key) with everything else reachable
	// only by scrolling inside that sliver, which reads as the rest of the
	// note having been deleted.
	const { clientHeight, scrollHeight } = await raw.evaluate(
		(element: HTMLTextAreaElement) => ({
			clientHeight: element.clientHeight,
			scrollHeight: element.scrollHeight,
		})
	)
	expect(clientHeight).toBeGreaterThanOrEqual(scrollHeight)
})
