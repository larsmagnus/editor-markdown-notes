import { Spinner } from '@/components/ui/spinner'

/**
 * Shown at the cursor while `/ask` waits for the first streamed chunk back -
 * mounted into a ProseMirror widget decoration by `ask-inline-status-widget-mount.ts`,
 * replaced by the real reply the instant it starts arriving, or by
 * `AskInlineErrorWidget` if the request fails (`ask-command.ts`).
 */
export function AskInlineLoadingWidget() {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-md bg-popover px-2 py-1 align-middle text-xs text-muted-foreground shadow-xs ring-1 ring-foreground/10">
			<Spinner className="size-3" />
			Asking Claude…
		</span>
	)
}
