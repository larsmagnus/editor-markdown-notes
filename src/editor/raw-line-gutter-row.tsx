import { memo } from 'react'

interface RawLineGutterRowProps {
	line: string
	number: number
	active: boolean
}

/**
 * One source line, laid out invisibly so it wraps like the real text, with its
 * number drawn in the margin beside the first visual row. Memoised so typing
 * on one line doesn't re-render every other.
 */
export const RawLineGutterRow = memo(function RawLineGutterRow({
	line,
	number,
	active,
}: RawLineGutterRowProps) {
	return (
		<div
			data-line={number}
			data-active={active || undefined}
			className="relative min-h-[1lh] before:visible before:absolute before:right-full before:pr-3 before:text-right before:text-muted-foreground/40 before:content-[attr(data-line)] data-active:before:text-foreground"
		>
			{line}
		</div>
	)
})
