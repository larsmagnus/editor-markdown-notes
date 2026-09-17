import type { LucideIcon } from 'lucide-react'

interface ViewToggleIconProps {
	on: boolean
	OnIcon: LucideIcon
	OffIcon: LucideIcon
}

export function ViewToggleIcon({ on, OnIcon, OffIcon }: ViewToggleIconProps) {
	const Icon = on ? OnIcon : OffIcon
	return <Icon />
}
