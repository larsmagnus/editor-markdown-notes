import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Command } from '@tiptap/pm/state'
import { moveTableColumn, moveTableRow } from '@tiptap/pm/tables'
import { Extension } from '@tiptap/react'

import { alignColumn } from '@/editor/extensions/table/alignment'
import type { TableAlign } from '@/editor/extensions/table/alignment'
import {
	moveCaretPastTable,
	moveCaretToCellBeyond,
} from '@/editor/extensions/table/caret'
import {
	removeCellSelection,
	selectCellBeside,
} from '@/editor/extensions/table/cell-selection'
import { keepHeaderInFirstRow } from '@/editor/extensions/table/header'

/**
 * Everything the table needs that `@tiptap/extension-table` does not bind:
 * reordering, column alignment, what a backspace over selected cells means,
 * shift-arrow across cells, the header row's place, and one schema flag.
 *
 * Wiring only - each behaviour lives in its own module beside this one.
 * `prosemirror-tables` ships row and column reordering, for instance, but TipTap
 * never wraps them, so the handles have no way to call them.
 */

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		tableCommands: {
			/** Moves the column at `from` so it sits where `to` was. */
			moveColumn: (from: number, to: number) => ReturnType
			/** Moves the row at `from` so it sits where `to` was. */
			moveRow: (from: number, to: number) => ReturnType
			/** Aligns every cell of the column the selection is in. */
			setColumnAlignment: (align: TableAlign) => ReturnType
		}
	}
}

export const TableCommands = Extension.create({
	name: 'tableCommands',

	// Deliberately left at the default priority. Raising it stops
	// `extendNodeSchema` below from reaching the schema at all, and it buys
	// nothing: `@tiptap/extension-table` binds Backspace too, but its handler
	// declines unless every cell is selected - which is the one case where it
	// and this one agree.
	extendNodeSchema(extension) {
		// A gap cursor is for a gap a paragraph could fill, which
		// prosemirror-gapcursor decides by asking whether the row's default child
		// is a textblock. Cells hold inline content here, so it is - and arrowing
		// out of a cell dropped a cursor between the cells of the row instead of
		// leaving the table.
		return extension.name === 'tableRow' ? { allowGapCursor: false } : {}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('tableHeaderRow'),
				appendTransaction: (_transactions, _oldState, newState) =>
					keepHeaderInFirstRow(newState) ?? undefined,
			}),
		]
	},

	addKeyboardShortcuts() {
		// The view goes through too: deciding whether a cell has another line to
		// reach is a question about layout, not about the document.
		const run = (command: Command) => () =>
			command(this.editor.state, this.editor.view.dispatch, this.editor.view)

		return {
			Backspace: run(removeCellSelection),
			Delete: run(removeCellSelection),
			'Mod-Backspace': run(removeCellSelection),
			'Mod-Delete': run(removeCellSelection),
			'Shift-ArrowRight': run(selectCellBeside('horiz', 1)),
			'Shift-ArrowLeft': run(selectCellBeside('horiz', -1)),
			'Shift-ArrowDown': run(selectCellBeside('vert', 1)),
			'Shift-ArrowUp': run(selectCellBeside('vert', -1)),
			ArrowDown: run(moveCaretToCellBeyond(1)),
			ArrowUp: run(moveCaretToCellBeyond(-1)),
			ArrowRight: run(moveCaretPastTable(1)),
			ArrowLeft: run(moveCaretPastTable(-1)),
		}
	},

	addCommands() {
		return {
			moveColumn:
				(from: number, to: number) =>
				({ state, dispatch }) =>
					moveTableColumn({ from, to })(state, dispatch),
			moveRow:
				(from: number, to: number) =>
				({ state, dispatch }) =>
					moveTableRow({ from, to })(state, dispatch),
			setColumnAlignment:
				(align: TableAlign) =>
				({ state, dispatch }) =>
					alignColumn(align)(state, dispatch),
		}
	},
})
