import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * A small triangle pointing from the popover content to its anchor. Not part
 * of the shadcn/ui registry's `popover.tsx`, so it lives here rather than in
 * `components/ui/` - that file can be regenerated cleanly by the CLI without
 * clobbering this.
 */
function PopoverArrow({
	className,
	...props
}: ComponentProps<typeof PopoverPrimitive.Arrow>) {
	return (
		<PopoverPrimitive.Arrow
			data-slot="popover-arrow"
			className={cn(
				'z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-popover data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5',
				className
			)}
			{...props}
		/>
	)
}

export { PopoverArrow }
