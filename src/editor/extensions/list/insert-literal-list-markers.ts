import {
	bulletMarkerText,
	orderedMarkerText,
	taskMarkerText,
} from '@/editor/extensions/list/list-marker'

/**
 * Reinstates literal bullet/ordered marker text into every plain `<li>`
 * markdown-it rendered - the `updateDOM` hook that runs before the schema's
 * own `parseHTML`, since markdown-it's list HTML carries the marker only in
 * the wrapping `<ul>`/`<ol>` tag (and the `<ol>`'s `start` attribute), never
 * as literal text. Skips `.task-list-item`s - `insertLiteralTaskMarkers`
 * (below) owns those, using the checkbox state `markdown-it-task-lists`
 * leaves behind before this ever runs.
 */
export function insertLiteralListMarkers(element: Element): void {
	element.querySelectorAll('li:not(.task-list-item)').forEach((item) => {
		const parent = item.parentElement
		if (!parent) return

		const target = item.querySelector('p') ?? item
		if (parent.tagName === 'OL') {
			const start = Number(parent.getAttribute('start') ?? '1')
			const index = Array.from(parent.children).indexOf(item)
			target.prepend(document.createTextNode(orderedMarkerText(start + index)))
		} else if (parent.tagName === 'UL') {
			target.prepend(document.createTextNode(bulletMarkerText()))
		}
	})
}

/**
 * Reinstates literal `- [ ] `/`- [x] ` marker text into every task item -
 * folding in the same checkbox-extraction `tiptap-markdown`'s own default
 * `taskItem` `updateDOM` does (`data-type`, `data-checked`, removing the
 * `<input>`), since overriding `parse` here replaces that default entirely
 * rather than layering on top of it.
 */
export function insertLiteralTaskMarkers(element: Element): void {
	element.querySelectorAll('.task-list-item').forEach((item) => {
		const input = item.querySelector('input')
		const checked = input?.checked ?? false

		item.setAttribute('data-type', 'taskItem')
		item.setAttribute('data-checked', String(checked))
		input?.remove()

		const target = item.querySelector('p') ?? item
		target.prepend(document.createTextNode(taskMarkerText(checked)))
	})
}
