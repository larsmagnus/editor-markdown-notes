import type { IssueSeverity } from '@/lib/text-tools/types'

/**
 * The classes that mark a finding, wherever it is drawn.
 *
 * Shared by the editor's decorations and the rule info popover's examples: the
 * popover's whole job is to show what a marker in the document means, so the
 * two must be styled by the same rule in `globals.css` and cannot be allowed to
 * drift apart.
 */
export function issueClassName(severity: IssueSeverity) {
	return `text-tools-issue text-tools-issue--${severity}`
}
