import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type TextToolsStatusProps = {
	isAnalyzing: boolean
	total: number
}

type Status = 'success' | 'pending' | 'none'

function getStatusVariant(isAnalyzing: boolean, total: number): Status {
	if (isAnalyzing) return 'pending'
	if (total === 0) return 'none'

	return 'success'
}

function statusText(isAnalyzing: boolean, total: number): string {
	if (isAnalyzing) return 'Checking…'
	if (total === 0) return 'No issues'

	return `${total} ${total === 1 ? 'suggestion' : 'suggestions'}`
}

/** How the checks are going, announced as it changes. */
export function TextToolsStatus({ isAnalyzing, total }: TextToolsStatusProps) {
	const status = getStatusVariant(isAnalyzing, total)

	return (
		<Badge
			className={cn(
				status === 'none' &&
					'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
				status === 'pending' && 'animate-pulse'
			)}
			variant={status === 'pending' ? 'secondary' : 'default'}
			aria-live="polite"
		>
			{status === 'pending' && <Spinner />}
			{statusText(isAnalyzing, total)}
		</Badge>
	)
}
