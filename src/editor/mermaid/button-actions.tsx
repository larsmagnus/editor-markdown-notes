import { ChevronDown, Code, FileCode } from 'lucide-react'

import { CopyActionsMenu } from '@/components/copy-actions-menu'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ButtonCopy } from '@/editor/button-copy'
import { openDiagramInClaude } from '@/editor/mermaid/actions'
import { useCopiedFeedback } from '@/hooks/use-copied-feedback'
import { useSettings } from '@/hooks/use-settings'
import { copyToClipboard } from '@/lib/clipboard'

type ButtonActionsProps = {
	/** The block's mermaid source. */
	code: string
	/** The diagram mermaid rendered from `code`. */
	svg: string
}

/**
 * Gets one diagram out of the editor: its source, its rendered SVG, or a
 * Claude session pointed at it - the block-level counterpart to the toolbar's
 * `ButtonCopy`, which does the same for the whole note.
 */
export function ButtonActions({ code, svg }: ButtonActionsProps) {
	const { isVSCodeContext } = useSettings()
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function copyCode() {
		copyToClipboard(code)
		showCopiedFeedback()
	}

	function copySvg() {
		copyToClipboard(svg)
		showCopiedFeedback()
	}

	function openInClaude() {
		if (openDiagramInClaude(code, isVSCodeContext)) showCopiedFeedback()
	}

	return (
		<>
			{/* The button sits at the toolbar's left edge, over the diagram - `left`
			    (the badge's default) or `bottom` would land the badge on top of it,
			    so it floats above the toolbar instead. */}
			<ButtonCopy
				copied={copied}
				label="Copy diagram code"
				badgeSide="top"
				onClick={copyCode}
			/>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							contentEditable={false}
							aria-label="Diagram actions"
						>
							<ChevronDown />
						</Button>
					}
				/>
				<CopyActionsMenu
					copyItems={[
						{ icon: <Code />, label: 'Copy diagram code', onClick: copyCode },
						{ icon: <FileCode />, label: 'Copy SVG', onClick: copySvg },
					]}
					onOpenInClaude={openInClaude}
				/>
			</DropdownMenu>
		</>
	)
}
