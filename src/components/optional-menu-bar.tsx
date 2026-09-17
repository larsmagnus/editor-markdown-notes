import { MenuBar } from '#src/components/menu-bar'

interface OptionalMenuBarProps {
	show?: boolean
}

export function OptionalMenuBar({ show }: OptionalMenuBarProps) {
	return show ? <MenuBar /> : null
}
