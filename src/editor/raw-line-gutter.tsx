import { cn } from 'cn'
import { useMemo } from 'react'
import type { RefObject } from 'react'

import { RawLineGutterRow } from '#src/editor/raw-line-gutter-row'
import { RAW_TEXT_LAYOUT } from '#src/editor/raw-text-layout'
import { useRawCaretLine } from '#src/hooks/use-raw-caret-line'
import { useSettings } from '#src/hooks/use-settings'

interface RawLineGutterProps {
	text: string
	/** Watched for the caret, to emphasise its line's number. */
	textareaRef: RefObject<HTMLTextAreaElement | null>
}

/**
 * Line numbers hung in the margin left of raw mode's text column.
 *
 * Each logical line is laid out invisibly in the mirror's exact box so it
 * wraps exactly as the real text does, and its number is a pseudo-element
 * parked beside the block's first visual row. That puts one number per source
 * line, however it wraps, without measuring anything.
 */
export function RawLineGutter({ text, textareaRef }: RawLineGutterProps) {
	const { settings } = useSettings()
	const activeLine = useRawCaretLine(textareaRef)
	const lines = useMemo(() => text.split('\n'), [text])

	if (!settings.lineNumbers) return null

	return (
		<pre
			aria-hidden="true"
			data-testid="raw-line-gutter"
			className={cn(
				RAW_TEXT_LAYOUT,
				'pointer-events-none invisible absolute inset-0 w-full select-none'
			)}
		>
			{lines.map((line, index) => (
				<RawLineGutterRow
					// eslint-disable-next-line react/no-array-index-key -- a line's identity is its position.
					key={index}
					line={line}
					number={index + 1}
					active={index === activeLine}
				/>
			))}
		</pre>
	)
}
