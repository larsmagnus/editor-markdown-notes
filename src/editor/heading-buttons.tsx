import { ButtonHeading } from '@/editor/button-heading'
import { HEADING_LEVEL_ICONS } from '@/editor/heading-level-icons'
import { HEADING_LEVELS } from '@/lib/heading-levels'

type HeadingButtonsProps = {
	/** Icons in the bubble, `H1`–`H6` text in the menu bar. */
	withIcons?: boolean
}

/** One button per heading level, shared by both menus. */
export function HeadingButtons({ withIcons }: HeadingButtonsProps) {
	return HEADING_LEVELS.map((level) => {
		const Icon = HEADING_LEVEL_ICONS[level]

		return (
			<ButtonHeading key={level} level={level}>
				{withIcons ? <Icon /> : undefined}
			</ButtonHeading>
		)
	})
}
