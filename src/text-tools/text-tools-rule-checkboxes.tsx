import { SpellingLanguagePicker } from '@/components/spelling-language-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { RULES } from '@/lib/text-tools/rules'
import type { SpellingLanguage, TextToolRuleId } from '@/shared/messages'
import { SPELLING_LANGUAGE_LABELS, TEXT_TOOL_RULE_IDS } from '@/shared/messages'
import { TextToolsRuleInfo } from '@/text-tools/text-tools-rule-info'

type TextToolsRuleCheckboxesProps = {
	rules: TextToolRuleId[]
	setRules: (rules: TextToolRuleId[]) => void
	spellingLanguage: SpellingLanguage
	setSpellingLanguage: (language: SpellingLanguage) => void
	hasSpellingFailed: boolean
}

/** Which checks to run. */
export function TextToolsRuleCheckboxes({
	rules,
	setRules,
	spellingLanguage,
	setSpellingLanguage,
	hasSpellingFailed,
}: TextToolsRuleCheckboxesProps) {
	const toggleRule = (ruleId: TextToolRuleId, checked: boolean) => {
		// Rebuilt from the canonical order so the persisted list never depends on
		// the order the user clicked things in.
		setRules(
			TEXT_TOOL_RULE_IDS.filter((id) =>
				id === ruleId ? checked : rules.includes(id)
			)
		)
	}

	return (
		<fieldset className="flex flex-col gap-1.5">
			<legend className="sr-only">Checks to run</legend>
			{TEXT_TOOL_RULE_IDS.map((ruleId) => (
				<Field
					key={ruleId}
					orientation="horizontal"
					title={RULES[ruleId].description}
				>
					<Checkbox
						id={ruleId}
						checked={rules.includes(ruleId)}
						onCheckedChange={(checked) => toggleRule(ruleId, !!checked)}
					/>
					<FieldLabel htmlFor={ruleId}>{RULES[ruleId].label}</FieldLabel>
					{ruleId === 'spelling' && (
						<SpellingLanguagePicker
							language={spellingLanguage}
							setLanguage={setSpellingLanguage}
						/>
					)}
					<TextToolsRuleInfo ruleId={ruleId} />
				</Field>
			))}
			{hasSpellingFailed && (
				// A ticked box reporting no misspellings is indistinguishable from a
				// clean document, so the one failure the panel cannot stay quiet
				// about is the dictionary never arriving.
				<p role="status" className="text-xs text-destructive">
					The {SPELLING_LANGUAGE_LABELS[spellingLanguage]} dictionary could not
					be loaded, so spelling is not being checked.
				</p>
			)}
		</fieldset>
	)
}
