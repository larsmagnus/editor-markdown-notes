import { test as base } from '@playwright/test'

import { createSelectionChangeCounter } from '#e2e/lib/selection-settle'

/**
 * `test`/`expect` with `createSelectionChangeCounter` wired in automatically,
 * so specs using `pressKeySettled`/`actionSettled` (`press-key-settled.ts`)
 * don't each have to call it before their own `openInVSCode`. Overrides the
 * `page` fixture rather than adding a new one, since the counter has to be an
 * init script - in before the app's own bundle evaluates - not a call made
 * once a page already exists.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await createSelectionChangeCounter(page)
		// Playwright's own fixture callback parameter, not a React hook.
		// oxlint-disable-next-line react-hooks/rules-of-hooks
		await use(page)
	},
})

export { expect } from '@playwright/test'
