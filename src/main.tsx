// oxlint-disable-next-line no-restricted-imports no-unassigned-import
import './globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '#src/app'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
