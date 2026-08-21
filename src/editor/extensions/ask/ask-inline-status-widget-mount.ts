import { createElement } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import { BadgeLoading } from '@/components/badge-loading'
import { AskInlineErrorWidget } from '@/editor/extensions/ask/ask-inline-error-widget'
import { createWidgetMount } from '@/editor/extensions/decoration-widget-mount'

// Two mounts, not one: the loading spinner sits mid-paragraph at the cursor
// and needs an inline `span` container, while the error card is a full block
// (border, padding, buttons) the same as every other `ErrorFallback` in the
// app, and needs a `div`. Only one is ever showing - `render` unmounts the
// other kind first, so switching between them never leaves a stale root.
const loadingWidget = createWidgetMount('span')
const errorWidget = createWidgetMount('div')

export function unmountActiveInlineStatusWidget() {
	loadingWidget.unmount()
	errorWidget.unmount()
}

/**
 * Renders the loading spinner into its own root, wrapped in `AppErrorBoundary`
 * for the same reason `ask-proposal-widget-mount.ts` is: this root sits
 * outside the app's normal component tree, so nothing else would catch a
 * render failure here. "Remove" clears the state via `onRemove`, which also
 * cancels the in-flight request (`ask-command.ts`).
 */
export function renderLoadingWidget(id: string, onRemove: () => void) {
	errorWidget.unmount()
	return loadingWidget.render(
		id,
		createElement(
			AppErrorBoundary,
			{ title: 'Ask Claude', resetKeys: [id], onRemove },
			createElement(BadgeLoading, {}, 'Asking Claude...')
		)
	)
}

/**
 * Renders the failed-request card - `AskInlineErrorWidget` already is an
 * error fallback, so this isn't wrapped in a second `AppErrorBoundary` the
 * way the spinner is.
 */
export function renderErrorWidget(
	id: string,
	error: string,
	onRetry: () => void,
	onDismiss: () => void
) {
	loadingWidget.unmount()
	return errorWidget.render(
		id,
		createElement(AskInlineErrorWidget, { error, onRetry, onDismiss })
	)
}
