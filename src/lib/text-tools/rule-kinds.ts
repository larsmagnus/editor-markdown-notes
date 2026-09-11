import type { TextToolRuleId } from '#src/shared/messages'

/**
 * Rules with no retext plugin behind them at all - each builds `TextIssue`s
 * directly in its own pass file (`polarity-issues.ts`, `dash-overuse-issues.ts`)
 * rather than through a `VFileMessage`. The single list a new rule of this
 * kind is added to: `word-issues.ts`'s `RULE_PLUGINS` and
 * `vfile-message-to-issue.ts`'s `RULE_SOURCES` both exclude it by deriving
 * from this type, rather than each carrying its own copy of the exclusion.
 */
const CUSTOM_PASS_RULE_IDS = ['polarity', 'dashOveruse'] as const
export type CustomPassRuleId = (typeof CUSTOM_PASS_RULE_IDS)[number]

/**
 * Rules that do have a retext plugin, but need a processor of their own
 * rather than sharing `word-issues.ts`'s one - readability runs its plugin
 * twice with different options (`unified` merges options of a plugin used
 * twice on one processor), and spelling's processor is cached across runs.
 */
const OWN_PROCESSOR_RULE_IDS = ['readability', 'spelling'] as const
type OwnProcessorRuleId = (typeof OWN_PROCESSOR_RULE_IDS)[number]

/** A rule plugged straight into `word-issues.ts`'s shared processor. */
export type PluginRuleId = Exclude<
	TextToolRuleId,
	CustomPassRuleId | OwnProcessorRuleId
>
