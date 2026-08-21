import { useCurrentEditor, useEditorState } from '@tiptap/react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	computeTextStats,
	countParagraphs,
} from '@/lib/text-tools/document-stats'

type TextToolsStatsProps = {
	sentenceCount: number
}

/** Reading-time formatting reads better than "0 min" for a short note. */
function formatReadingTime(minutes: number): string {
	return minutes === 0 ? '< 1 min' : `${minutes} min`
}

/** Word, character, sentence, paragraph and reading-time counts for the document, collapsed behind an accordion. */
export function TextToolsStats({ sentenceCount }: TextToolsStatsProps) {
	const { editor } = useCurrentEditor()
	const { text, rawText, paragraphs } = useEditorState({
		editor,
		selector: ({ editor }) => ({
			text: editor?.getText() ?? '',
			rawText: editor?.getText({ blockSeparator: '' }) ?? '',
			paragraphs: editor ? countParagraphs(editor.state.doc) : 0,
		}),
	}) ?? { text: '', rawText: '', paragraphs: 0 }

	const { words, characters, readingTimeMinutes } = computeTextStats(
		text,
		rawText
	)
	const averageWordsPerSentence =
		sentenceCount === 0 ? '—' : Math.round(words / sentenceCount)

	return (
		<Accordion>
			<AccordionItem value="stats">
				<AccordionTrigger className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Document stats
				</AccordionTrigger>
				<AccordionContent>
					<dl className="grid grid-cols-2 items-end gap-x-2 gap-y-1">
						<dt className="text-muted-foreground">Words</dt>
						<dd className="text-right">{words}</dd>
						<dt className="text-muted-foreground">Characters</dt>
						<dd className="text-right">{characters}</dd>
						<dt className="text-muted-foreground">Sentences</dt>
						<dd className="text-right">{sentenceCount}</dd>
						<dt className="text-muted-foreground">Paragraphs</dt>
						<dd className="text-right">{paragraphs}</dd>
						<dt className="text-muted-foreground">Avg. words/sentence</dt>
						<dd className="text-right">{averageWordsPerSentence}</dd>
						<dt className="text-muted-foreground">Reading time</dt>
						<dd className="text-right">
							{formatReadingTime(readingTimeMinutes)}
						</dd>
					</dl>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}
