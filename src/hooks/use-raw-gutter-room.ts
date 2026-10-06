import type { CSSProperties } from 'react'

import { useSettings } from '#src/hooks/use-settings'
import {
	rawGutterRoomClassName,
	rawGutterWidthStyle,
} from '#src/lib/raw-gutter-room-class'

interface RawGutterRoom {
	className: string
	style: CSSProperties
}

/** What the raw wrapper needs to make room for the line-number gutter. */
export function useRawGutterRoom(lineCount: number): RawGutterRoom {
	const { settings, viewOptions } = useSettings()

	return {
		className: rawGutterRoomClassName({
			...settings,
			fullWidth: viewOptions.fullWidth,
		}),
		style: rawGutterWidthStyle(lineCount),
	}
}
