import { Unlink } from 'lucide-react'

import { ButtonToggle } from '@/components/button-toggle'
import { useEditorLink } from '@/hooks/use-editor-link'

/** Removes the link mark from the current selection or image. */
export function ButtonUnlink() {
	const { isLinkActive, unsetLink } = useEditorLink()

	return (
		<ButtonToggle
			active={isLinkActive()}
			title="Unlink"
			onClick={() => unsetLink()}
			className="font-bold"
		>
			<Unlink className="size-4" />
		</ButtonToggle>
	)
}
