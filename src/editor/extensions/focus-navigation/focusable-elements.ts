/** Direction to search in: forward toward the end of the page, or back. */
export type FocusDirection = 1 | -1

// The closed set of natively-focusable tags, plus `[tabindex]` for anything
// else - nothing to add here as the app grows.
const FOCUSABLE_SELECTOR = [
	'a[href]',
	'area[href]',
	'button',
	'input',
	'select',
	'textarea',
	'iframe',
	'audio[controls]',
	'video[controls]',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]',
].join(', ')

function isDisabled(element: HTMLElement): boolean {
	return 'disabled' in element && Boolean(element.disabled)
}

/** A link mark inside editable text can't actually take DOM focus there -
 *  `.focus()` silently no-ops - unlike a node view's button, which always
 *  sits in its own `contentEditable="false"` island. */
function isUnfocusableInlineMark(element: HTMLElement): boolean {
	return (
		element.closest('[contenteditable]')?.getAttribute('contenteditable') ===
		'true'
	)
}

/**
 * Every element the escape hatch may land on, in page order.
 *
 * `tabIndex !== -1` excludes a checkbox's hidden native `<input>` (Base UI
 * pairs it with a visible `role="checkbox"` element). `checkVisibility`
 * (CSS only, not opacity) excludes `display: none`/detached/`visibility:
 * hidden` elements while still keeping the `opacity-0` hover-reveal buttons
 * on code blocks, the mermaid toolbar, and the image toolbar, which are all
 * genuinely focusable today. `[data-base-ui-portal]` is the one marker every
 * Base UI overlay shares, and excludes them all - each runs its own
 * Tab/arrow-key navigation. An open overlay also plants tabbable sentinel
 * spans outside that wrapper to catch Tab leaving it; they are
 * `aria-hidden`, as is anything else that exists for the browser rather
 * than the reader, and landing on one is a dead end. Excludes the
 * ProseMirror root itself too - the frame of reference this measures
 * against, never a destination.
 */
export function getPageFocusableElements(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
	).filter(
		(element) =>
			element.tabIndex !== -1 &&
			!isDisabled(element) &&
			element.checkVisibility({ checkVisibilityCSS: true }) &&
			element.contentEditable !== 'true' &&
			!isUnfocusableInlineMark(element) &&
			!element.closest('[data-base-ui-portal], [aria-hidden="true"]')
	)
}

/** Whether `element` sits after (`1`), before (`-1`), or at (`0`) a DOM
 *  position - the raw comparison both this module and `nearest-stop.ts`
 *  need. */
export function compareElementToDomPoint(
	element: Element,
	point: { node: Node; offset: number }
): number {
	const range = document.createRange()
	range.setStart(point.node, point.offset)
	range.collapse(true)
	return range.comparePoint(element, 0)
}

/** The first/last page-focusable element strictly after/before a DOM
 *  position, or `undefined` if there is none. */
export function findFocusableInDirection(
	point: { node: Node; offset: number },
	direction: FocusDirection
): HTMLElement | undefined {
	const elements = getPageFocusableElements()
	let target: HTMLElement | undefined

	for (const element of elements) {
		const position = compareElementToDomPoint(element, point)
		if (direction === 1 && position > 0) {
			target = element
			break
		}
		if (direction === -1 && position < 0) {
			target = element
		}
	}

	return target
}

/** Focuses the first/last page-focusable element strictly after/before a
 *  DOM position. Elements only: from a bare caret, leaving text for a
 *  button is the whole point of arming this with Escape. */
export function focusRelativeToDomPoint(
	point: { node: Node; offset: number },
	direction: FocusDirection
): boolean {
	const target = findFocusableInDirection(point, direction)
	if (!target) return false

	target.focus()
	return true
}
