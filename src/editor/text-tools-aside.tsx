import { lazy } from 'react'

import { useSettings } from '@/hooks/use-settings'
import type { Analysis } from '@/lib/text-tools/types'

const TextToolsPanel = lazy(() =>
	import('@/editor/text-tools-panel').then((module) => ({
		default: module.TextToolsPanel,
	}))
)

type TextToolsAsideProps = {
	analysis: Analysis
	isAnalyzing: boolean
}

/**
 * The text tools panel, wired to the view options that switch it on.
 *
 * The whole retext stack sits behind the lazy import, so a session with the
 * tools off never loads it.
 */
export function TextToolsAside({ analysis, isAnalyzing }: TextToolsAsideProps) {
	const { viewOptions, setViewOptions } = useSettings()

	if (!viewOptions.textTools) return null

	return (
		<TextToolsPanel
			analysis={analysis}
			isAnalyzing={isAnalyzing}
			rules={viewOptions.textToolRules}
			setRules={(textToolRules) => setViewOptions({ textToolRules })}
		/>
	)
}
