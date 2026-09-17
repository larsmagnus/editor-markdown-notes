import { lazy, Suspense } from 'react'

import type { DevFileSelectorProps } from '#src/components/dev-file-selector'

const DevFileSelector = import.meta.env.DEV
	? lazy(() => import('#src/components/dev-file-selector'))
	: null

interface OptionalDevFileSelectorProps {
	show: boolean
	files: DevFileSelectorProps['values']
	fileName: string
	setFileName: DevFileSelectorProps['setValue']
}

export function OptionalDevFileSelector({
	show,
	files,
	fileName,
	setFileName,
}: OptionalDevFileSelectorProps) {
	if (!DevFileSelector || !show) return null

	return (
		<Suspense fallback={null}>
			<DevFileSelector values={files} value={fileName} setValue={setFileName} />
		</Suspense>
	)
}
