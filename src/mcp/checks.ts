import { RULES } from '@/lib/text-tools/rules'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

/** Every check this server can run, in the wording the extension's panel uses. */
export function listChecks() {
	// Walked in the shared id order rather than `RULES`' own key order, so the
	// list an agent reads matches the order the panel lists its toggles in.
	return TEXT_TOOL_RULE_IDS.map((id) => ({
		id,
		label: RULES[id].label,
		description: RULES[id].description,
		explanation: RULES[id].explanation,
		example: {
			before: RULES[id].example.before.map((part) => part.text).join(''),
			after: RULES[id].example.after,
		},
	}))
}
