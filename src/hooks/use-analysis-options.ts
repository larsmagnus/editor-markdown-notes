import { useSpellingDictionary } from '@/hooks/use-spelling-dictionary'
import type { PipelineOptions } from '@/lib/text-tools/types'
import type { SpellingLanguage, TextToolRuleId } from '@/shared/messages'

type UseAnalysisOptionsInput = {
	enabled: boolean
	rules: TextToolRuleId[]
	targetAge: number
	spellingLanguage: SpellingLanguage
	spellingIgnoreWords: string[]
}

/**
 * Everything the worker should be asked for, and one string that changes
 * exactly when the answer does.
 *
 * The key exists because `viewOptions.textToolRules` is rebuilt by its zod
 * `.transform` on every config broadcast: an effect depending on the array
 * itself would re-analyse every open tab whenever any *other* view option
 * changed. `spellingIgnoreWords` is joined in for the same reason.
 */
export function useAnalysisOptions({
	enabled,
	rules,
	targetAge,
	spellingLanguage,
	spellingIgnoreWords,
}: UseAnalysisOptionsInput) {
	const wantsSpelling = rules.includes('spelling')
	const { dictionary, hasFailed } = useSpellingDictionary(
		spellingLanguage,
		enabled && wantsSpelling
	)

	// Spelling only counts as enabled once its dictionary is here, so a run while
	// the chunk is still in flight reports the other checks rather than failing.
	const activeRules =
		dictionary || !wantsSpelling
			? rules
			: rules.filter((ruleId) => ruleId !== 'spelling')

	const options: PipelineOptions = {
		rules: activeRules,
		targetAge,
		spellingLanguage,
		dictionary,
		ignoreWords: spellingIgnoreWords,
	}

	const key = [
		activeRules.join(','),
		targetAge,
		spellingLanguage,
		dictionary ? 'ready' : 'pending',
		spellingIgnoreWords.join(','),
	].join('|')

	return { options, key, hasSpellingFailed: wantsSpelling && hasFailed }
}
