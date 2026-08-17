import type { Editor } from '@tiptap/core'
import type { PluginKey, Transaction } from '@tiptap/pm/state'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

interface SingleWidgetDecorationPluginConfig<State extends { id: string }> {
	key: PluginKey<State | null>
	/** Remaps `current`'s stored position(s) through a doc-changing transaction, so the widget stays anchored to the right text/position. */
	mapPosition: (current: State, tr: Transaction) => State
	/** Where in the document the widget decoration sits. */
	widgetPosition: (current: State) => number
	render: (current: State, editor: Editor) => HTMLElement
	unmount: () => void
}

/**
 * A ProseMirror plugin holding a single nullable state value, rendered as one
 * widget decoration - the shape `ask-proposal-plugin.ts` and
 * `ask-inline-status-plugin.ts` both need: a meta-driven state update (start/
 * append/finish/clear), positions re-mapped through `tr.mapping` on every
 * doc-changing transaction so the widget stays anchored while streaming, and
 * a widget rendered by handing off to a feature-specific `render`.
 *
 * `render`/`unmount`/`mapPosition`/`widgetPosition` are the only
 * feature-specific pieces - everything else (the `apply` logic, the
 * decoration wiring) was previously duplicated between the two plugins this
 * factory replaces.
 */
export function createSingleWidgetDecorationPlugin<
	State extends { id: string },
>(
	editor: Editor,
	config: SingleWidgetDecorationPluginConfig<State>
): Plugin<State | null> {
	function apply(tr: Transaction, current: State | null): State | null {
		const meta = tr.getMeta(config.key) as State | null | undefined
		if (meta !== undefined) return meta

		if (!current || !tr.docChanged) return current
		return config.mapPosition(current, tr)
	}

	return new Plugin<State | null>({
		key: config.key,
		state: { init: () => null, apply },
		props: {
			decorations(state) {
				const current = config.key.getState(state)
				if (!current) {
					config.unmount()
					return null
				}

				const container = config.render(current, editor)
				return DecorationSet.create(state.doc, [
					Decoration.widget(config.widgetPosition(current), () => container, {
						key: current.id,
						side: 1,
					}),
				])
			},
		},
	})
}
