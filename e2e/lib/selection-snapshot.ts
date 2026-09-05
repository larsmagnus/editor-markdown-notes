declare global {
	interface Window {
		/** Installed by `createSelectionChangeCounter`; absent until then. */
		__selectionChangeCount?: number
	}
}

export interface SelectionSnapshot {
	seq: number
	dom: string
}

/**
 * Self-contained on purpose: this runs via `page.evaluate`, which serializes
 * only a function's own source text - a call out to a sibling helper in this
 * module would be a `ReferenceError` in the browser, since nothing outside
 * the passed function's body travels with it.
 */
export function takeSelectionSnapshot(): SelectionSnapshot {
	const selection = document.getSelection()
	const dom = selection
		? [
				selection.anchorNode?.textContent?.slice(0, 20),
				selection.anchorOffset,
				selection.focusNode?.textContent?.slice(0, 20),
				selection.focusOffset,
			].join('|')
		: ''

	return { seq: window.__selectionChangeCount ?? 0, dom }
}
