/**
 * How wide the document renders.
 *
 * `max-w-full` overrides the prose plugin's built-in 65ch cap; `mx-auto` centres
 * the content against that cap instead.
 */
export function contentWidthClassName({
	fullWidth,
	centerContent,
}: {
	fullWidth: boolean
	centerContent: boolean
}): string {
	if (fullWidth) return 'max-w-full'

	return centerContent ? 'mx-auto' : ''
}
