// oxlint-disable-next-line no-restricted-imports
import './globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
