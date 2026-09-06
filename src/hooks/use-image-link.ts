import type { NodeViewProps } from '@tiptap/react'

import { setImageLink, unsetImageLink } from '@/editor/extensions/image/link'

export type ImageLink = {
	linked: boolean
	href: string
	setLink: (href: string) => void
	unsetLink: () => void
}

/**
 * This image's link mark, if any, and commands to set/unset it - scoped to
 * its own position, not the editor's selection, since every image's toolbar
 * is mounted independent of it. Derived straight from `node.marks`, not a
 * `use-editor-flag.ts` subscription: that skips computing on mount, which
 * would hide an already-linked image's state until the first transaction.
 */
export function useImageLink({
	node,
	editor,
	getPos,
}: Pick<NodeViewProps, 'node' | 'editor' | 'getPos'>): ImageLink {
	const mark = editor.schema.marks.link.isInSet(node.marks)
	const linked = Boolean(mark)
	const href = typeof mark?.attrs.href === 'string' ? mark.attrs.href : ''

	const setLink = (href: string) => {
		const pos = getPos()
		if (pos === undefined || href.trim() === '') return
		editor
			.chain()
			.command(({ state, dispatch }) =>
				setImageLink(pos, { href })(state, dispatch)
			)
			.run()
	}

	const unsetLink = () => {
		const pos = getPos()
		if (pos === undefined) return
		editor
			.chain()
			.command(({ state, dispatch }) => unsetImageLink(pos)(state, dispatch))
			.run()
	}

	return { linked, href, setLink, unsetLink }
}
