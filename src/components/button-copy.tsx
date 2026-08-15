import { ChevronDown, Code, Copy, FileType } from 'lucide-react'

import { CopiedBadge } from '@/components/copied-badge'
import { IconClaude } from '@/components/icons/icon-claude'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCopiedFeedback } from '@/hooks/use-copied-feedback'
import { useSettings } from '@/hooks/use-settings'
import { markdownToPlainText } from '@/lib/markdown-to-text'
import { getVSCodeApi } from '@/lib/vscode-api'

type ButtonCopyProps = { content: string }

/**
 * Toolbar action for getting the current note out of the editor: copy as
 * markdown or plain text (both include any frontmatter), or hand it to
 * Claude.
 */
export function ButtonCopy({ content }: ButtonCopyProps) {
	const { isVSCodeContext } = useSettings()
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function copyMarkdown() {
		void navigator.clipboard?.writeText(content)
		showCopiedFeedback()
	}

	function copyPlainText() {
		void navigator.clipboard?.writeText(markdownToPlainText(content))
		showCopiedFeedback()
	}

	function openInClaude() {
		if (isVSCodeContext) {
			getVSCodeApi()?.postMessage({ type: 'openClaudeTerminal' })
			return
		}
		// Acknowledged like any other copy: this replaces whatever the reader had
		// on their clipboard, which is not something to do silently.
		void navigator.clipboard?.writeText(content)
		showCopiedFeedback()
		window.open('https://claude.ai', '_blank', 'noopener,noreferrer')
	}

	return (
		<div className="relative">
			<ButtonGroup>
				{/* `active:not-aria-[haspopup]:translate-y-px` is Button's default press
				feedback; canceled here (same variant chain, so `cn`'s tailwind-merge
				drops the original rather than leaving both to fight over source
				order) because the adjacent dropdown trigger doesn't get it - it
				carries `aria-haspopup`, which that style excludes - so the two would
				otherwise move inconsistently when this button group is pressed. */}
				<Button
					variant="outline"
					className="active:not-aria-[haspopup]:translate-y-0"
					onClick={copyMarkdown}
				>
					<Copy /> Copy page
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button variant="outline" aria-label="Open">
								<ChevronDown />
							</Button>
						}
					/>
					<DropdownMenuContent className="w-52">
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={copyMarkdown}>
								<Code /> Copy markdown
							</DropdownMenuItem>
							<DropdownMenuItem onClick={copyPlainText}>
								<FileType /> Copy plain text
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={openInClaude}>
								<IconClaude /> Open in Claude
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</ButtonGroup>

			<CopiedBadge show={copied} />
		</div>
	)
}
