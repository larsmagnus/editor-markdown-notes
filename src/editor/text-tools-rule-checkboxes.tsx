import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { TextToolsRuleInfo } from '@/editor/text-tools-rule-info'
import { RULES } from '@/lib/text-tools/rules'
import type { TextToolRuleId } from '@/shared/messages'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

type TextToolsRuleCheckboxesProps = {
	rules: TextToolRuleId[]
	setRules: (rules: TextToolRuleId[]) => void
}

/** Which checks to run. */
export function TextToolsRuleCheckboxes({
	rules,
	setRules,
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
					<TextToolsRuleInfo ruleId={ruleId} />
				</Field>
			))}
		</fieldset>
	)
}
