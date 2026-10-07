import type { Page } from '@playwright/test'

import { expect, test } from '#e2e/lib/fixtures'
import { actionSettled, pressKeySettled } from '#e2e/lib/press-key-settled'
import { openInVSCode } from '#e2e/lib/vscode-host'

type Keystroke =
	| 'backspace at content start'
	| 'backspace twice'
	| 'backspace before marker'
	| 'delete at end of the line above'

type Case = {
	note: string
	item: string
	markerLength: number
	expected: Partial<Record<Keystroke, string>>
}

/**
 * What deleting into a list item does, for every kind of list and every
 * place an item can sit - Obsidian's behaviour, since the file is the source
 * of truth: Backspace at an item's content takes its marker away and lifts it
 * out (a nested item becomes a line of its parent), a second Backspace joins
 * the line to the one above, and Delete at the end of a line pulls the next
 * item's text up without its marker. No keystroke may leave a marker behind
 * as literal text, or have one written straight back.
 */
const CASES: Record<string, Case> = {
	'middle bullet item': {
		note: '- one\n- two\n- three',
		item: 'two',
		markerLength: 2,
		expected: {
			'backspace at content start': '- one\n\ntwo\n\n- three',
			'backspace twice': '- onetwo\n- three',
			'backspace before marker': '- one\n\ntwo\n\n- three',
			'delete at end of the line above': '- onetwo\n- three',
		},
	},
	'middle star bullet item': {
		note: '* one\n* two\n* three',
		item: 'two',
		markerLength: 2,
		expected: {
			'backspace at content start': '* one\n\ntwo\n\n* three',
			'backspace twice': '* onetwo\n* three',
			'backspace before marker': '* one\n\ntwo\n\n* three',
			'delete at end of the line above': '* onetwo\n* three',
		},
	},
	'middle ordered item': {
		note: '1. one\n2. two\n3. three',
		item: 'two',
		markerLength: 3,
		expected: {
			'backspace at content start': '1. one\n\ntwo\n\n3. three',
			'backspace twice': '1. onetwo\n2. three',
			'backspace before marker': '1. one\n\ntwo\n\n3. three',
			'delete at end of the line above': '1. onetwo\n2. three',
		},
	},
	'middle task item': {
		note: '- [ ] one\n- [x] two\n- [ ] three',
		item: 'two',
		markerLength: 6,
		expected: {
			'backspace at content start': '- [ ] one\n\ntwo\n\n- [ ] three',
			'backspace twice': '- [ ] onetwo\n- [ ] three',
			'backspace before marker': '- [ ] one\n\ntwo\n\n- [ ] three',
			'delete at end of the line above': '- [ ] onetwo\n- [ ] three',
		},
	},
	'first bullet item': {
		note: '- one\n- two',
		item: 'one',
		markerLength: 2,
		expected: {
			'backspace at content start': 'one\n\n- two',
			'backspace twice': 'one\n\n- two',
			'backspace before marker': 'one\n\n- two',
		},
	},
	'last bullet item': {
		note: '- one\n- two',
		item: 'two',
		markerLength: 2,
		expected: {
			'backspace at content start': '- one\n\ntwo',
			'backspace twice': '- onetwo',
			'backspace before marker': '- one\n\ntwo',
			'delete at end of the line above': '- onetwo',
		},
	},
	'nested bullet item': {
		note: '- one\n  - two\n- three',
		item: 'two',
		markerLength: 2,
		expected: {
			'backspace at content start': '- one\n\n  two\n- three',
			'backspace twice': '- onetwo\n- three',
			'backspace before marker': '- one\n- two\n- three',
			'delete at end of the line above': '- onetwo\n- three',
		},
	},
	'nested task item': {
		note: '- [ ] one\n  - [ ] two\n- [ ] three',
		item: 'two',
		markerLength: 6,
		expected: {
			'backspace at content start': '- [ ] one\n\n  two\n- [ ] three',
			'backspace twice': '- [ ] onetwo\n- [ ] three',
			'backspace before marker': '- [ ] one\n- [ ] two\n- [ ] three',
			'delete at end of the line above': '- [ ] onetwo\n- [ ] three',
		},
	},
	'nested ordered item': {
		note: '1. one\n   1. two\n2. three',
		item: 'two',
		markerLength: 3,
		expected: {
			'backspace at content start': '1. one\n\n   two\n2. three',
			'backspace twice': '1. onetwo\n2. three',
			'delete at end of the line above': '1. onetwo\n2. three',
		},
	},
}

/** Puts the caret at the very start of `item`'s line, before its marker. */
async function caretBeforeMarker(page: Page, item: string) {
	const content = page.getByRole('textbox').first()
	await actionSettled(page, () =>
		content.locator('li p', { hasText: item }).last().click()
	)
	await pressKeySettled(page, 'Home')
}

async function press(page: Page, keystroke: Keystroke, markerLength: number) {
	if (keystroke === 'delete at end of the line above') {
		await pressKeySettled(page, 'ArrowLeft')
		await pressKeySettled(page, 'Delete')
		return
	}
	if (keystroke !== 'backspace before marker') {
		for (let i = 0; i < markerLength; i++)
			await pressKeySettled(page, 'ArrowRight')
	}
	await pressKeySettled(page, 'Backspace')
	if (keystroke === 'backspace twice') await pressKeySettled(page, 'Backspace')
}

test.describe('Deleting into a list item in the live editor', () => {
	for (const [name, { note, item, markerLength, expected }] of Object.entries(
		CASES
	)) {
		for (const [keystroke, markdown] of Object.entries(expected)) {
			test(`${name}: ${keystroke}`, async ({ page }) => {
				await openInVSCode(page, note)

				await caretBeforeMarker(page, item)
				await press(page, keystroke as Keystroke, markerLength)

				await page.getByRole('button', { name: 'Raw editor' }).click()
				await expect(
					page.getByRole('textbox', { name: 'Raw markdown' })
				).toHaveValue(markdown)
			})
		}
	}
})
