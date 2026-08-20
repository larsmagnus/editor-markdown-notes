import { Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useEditorLink } from '@/hooks/use-editor-link'
import { cn } from '@/lib/utils'

/** Removes the link mark from the current selection or image. */
export function ButtonUnlink() {
	const { isLinkActive, unsetLink } = useEditorLink()

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			title="Unlink"
			onClick={() => unsetLink()}
			className={cn('font-bold', isLinkActive() ? 'is-active' : '')}
		>
			<Unlink className="size-4" />
		</Button>
	)
}
