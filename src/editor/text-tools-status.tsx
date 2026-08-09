type TextToolsStatusProps = {
	isAnalyzing: boolean
	total: number
}

function statusText(isAnalyzing: boolean, total: number): string {
	if (isAnalyzing) return 'Checking…'
	if (total === 0) return 'Nothing to flag.'

	return `${total} ${total === 1 ? 'suggestion' : 'suggestions'}`
}

/** How the checks are going, announced as it changes. */
export function TextToolsStatus({ isAnalyzing, total }: TextToolsStatusProps) {
	return (
		<p className="mt-1 text-muted-foreground" aria-live="polite">
			{statusText(isAnalyzing, total)}
		</p>
	)
}
