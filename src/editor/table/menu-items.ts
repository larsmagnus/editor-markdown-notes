import type { ChainedCommands } from '@tiptap/react'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	ArrowDown,
	ArrowDownToLine,
	ArrowLeft,
	ArrowLeftToLine,
	ArrowRight,
	ArrowRightToLine,
	ArrowUp,
	ArrowUpToLine,
	MoreHorizontal,
	MoreVertical,
	Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TableAxis = 'row' | 'column'

/**
 * The handle itself: what it is called, which ellipsis it draws, and the pill
 * it draws it in - the row's being the column's turned on its side, so the two
 * read as one control seen from two directions.
 */
export const TABLE_AXES: Record<
	TableAxis,
	{ label: string; icon: LucideIcon; shape: string }
> = {
	row: { label: 'Row actions', icon: MoreVertical, shape: 'h-7 w-5' },
	column: { label: 'Column actions', icon: MoreHorizontal, shape: 'h-5 w-7' },
}

export type TableMenuItem = {
	label: string
	icon: LucideIcon
	/** Applies to an already-focused chain, at the handle's own row or column. */
	run: (chain: ChainedCommands, index: number) => ChainedCommands
	/** Whether the item applies here at all - the edges have nowhere to move to. */
	enabled?: (index: number, count: number) => boolean
	/** Removes what the handle points at, so it reads as destructive. */
	destructive?: boolean
	/** Starts a new group in the menu. */
	startsGroup?: boolean
}

/** There is a line before this one to swap with. */
const notFirst = (index: number) => index > 0

/** There is a line after this one to swap with. */
const notLast = (index: number, count: number) => index < count - 1

/**
 * What each handle's menu offers, as a table rather than a component per axis.
 *
 * The same shape as `text-style-commands.ts`: the menu renders whatever is
 * listed here, so adding an action is one entry rather than an entry plus a
 * button plus a branch.
 */
export const TABLE_MENU_ITEMS: Record<TableAxis, TableMenuItem[]> = {
	row: [
		{
			label: 'Add row above',
			icon: ArrowUpToLine,
			run: (chain) => chain.addRowBefore(),
		},
		{
			label: 'Add row below',
			icon: ArrowDownToLine,
			run: (chain) => chain.addRowAfter(),
		},
		{
			label: 'Move row up',
			icon: ArrowUp,
			run: (chain, index) => chain.moveRow(index, index - 1),
			enabled: notFirst,
			startsGroup: true,
		},
		{
			label: 'Move row down',
			icon: ArrowDown,
			run: (chain, index) => chain.moveRow(index, index + 1),
			enabled: notLast,
		},
		{
			label: 'Delete row',
			icon: Trash2,
			run: (chain) => chain.deleteRow(),
			destructive: true,
			startsGroup: true,
		},
	],
	column: [
		{
			label: 'Add column before',
			icon: ArrowLeftToLine,
			run: (chain) => chain.addColumnBefore(),
		},
		{
			label: 'Add column after',
			icon: ArrowRightToLine,
			run: (chain) => chain.addColumnAfter(),
		},
		{
			label: 'Move column left',
			icon: ArrowLeft,
			run: (chain, index) => chain.moveColumn(index, index - 1),
			enabled: notFirst,
			startsGroup: true,
		},
		{
			label: 'Move column right',
			icon: ArrowRight,
			run: (chain, index) => chain.moveColumn(index, index + 1),
			enabled: notLast,
		},
		{
			label: 'Align left',
			icon: AlignLeft,
			run: (chain) => chain.setColumnAlignment('left'),
			startsGroup: true,
		},
		{
			label: 'Align center',
			icon: AlignCenter,
			run: (chain) => chain.setColumnAlignment('center'),
		},
		{
			label: 'Align right',
			icon: AlignRight,
			run: (chain) => chain.setColumnAlignment('right'),
		},
		{
			label: 'Reset alignment',
			icon: AlignJustify,
			run: (chain) => chain.setColumnAlignment(null),
		},
		{
			label: 'Delete column',
			icon: Trash2,
			run: (chain) => chain.deleteColumn(),
			destructive: true,
			startsGroup: true,
		},
	],
}
