import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SpellingLanguage } from '@/shared/messages'
import { SPELLING_LANGUAGE_LABELS, SPELLING_LANGUAGES } from '@/shared/messages'

type SpellingLanguagePickerProps = {
	language: SpellingLanguage
	setLanguage: (language: SpellingLanguage) => void
}

/**
 * Which English the spelling check measures against.
 *
 * Sits beside the spelling checkbox rather than in the toolbar: the moment a
 * reader wants it is the moment they see "colour" flagged, and that happens
 * while they are looking at this panel.
 */
export function SpellingLanguagePicker({
	language,
	setLanguage,
}: SpellingLanguagePickerProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
						title="Which English the spelling check uses"
					>
						{SPELLING_LANGUAGE_LABELS[language]}
						<ChevronDown className="size-3" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				{SPELLING_LANGUAGES.map((candidate) => (
					<DropdownMenuItem
						key={candidate}
						onClick={() => setLanguage(candidate)}
					>
						{SPELLING_LANGUAGE_LABELS[candidate]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
