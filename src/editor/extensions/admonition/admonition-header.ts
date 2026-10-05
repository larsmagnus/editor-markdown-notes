import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ADMONITIONS } from '#src/editor/extensions/admonition/admonition-types'
import type { AdmonitionType } from '#src/lib/admonition-tag'

const ICON_SIZE = 16

const iconMarkup: Partial<Record<AdmonitionType, string>> = {}

/** Static SVG for `type`'s icon, rendered once; a widget cannot host a React tree. */
function iconFor(type: AdmonitionType): string {
	iconMarkup[type] ??= renderToStaticMarkup(
		createElement(ADMONITIONS[type].icon, {
			size: ICON_SIZE,
			'aria-hidden': true,
		})
	)
	return iconMarkup[type]
}

/**
 * The icon-and-label line drawn in place of the `> [!TYPE]` text while it is
 * hidden. Never editable: the text it stands in for is the real content.
 */
export function createAdmonitionHeader(type: AdmonitionType): HTMLElement {
	const header = document.createElement('span')
	header.className = 'admonition-header'
	header.contentEditable = 'false'
	header.innerHTML = iconFor(type)
	header.append(document.createTextNode(ADMONITIONS[type].label))
	return header
}
