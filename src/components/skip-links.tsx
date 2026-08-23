import LinkSkip from '@/components/link-skip'
import {
	asSkipLinkClick,
	skipTargetId,
	skipToEditor,
} from '@/editor/extensions/focus-navigation/skip-target'
import { TEXT_TOOLS_PANEL_ID } from '@/text-tools/text-tools-panel'

type SkipLinksProps = {
	raw: boolean
	textToolsOpen: boolean
}

function skipToTextTools() {
	document.getElementById(TEXT_TOOLS_PANEL_ID)?.focus()
}

/** The page's skip-link cluster: one per major landmark, reachable from the
 *  very first Tab press. */
export function SkipLinks({ raw, textToolsOpen }: SkipLinksProps) {
	return (
		<>
			<LinkSkip
				href={`#${skipTargetId(raw)}`}
				onClick={asSkipLinkClick(skipToEditor)}
			>
				Skip to editor
			</LinkSkip>
			{textToolsOpen && !raw && (
				<LinkSkip
					href={`#${TEXT_TOOLS_PANEL_ID}`}
					onClick={asSkipLinkClick(skipToTextTools)}
				>
					Skip to text tools
				</LinkSkip>
			)}
		</>
	)
}
