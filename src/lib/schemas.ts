import { z } from 'zod'

import {
	DEFAULT_SETTINGS,
	DEFAULT_VIEW_OPTIONS,
	TEXT_TOOL_RULE_IDS,
} from '@/shared/messages'

/**
 * Runtime validation for everything the webview receives from outside itself:
 * `localStorage` (hand-editable), and the config payloads posted by the
 * extension host (which may be an older version than this bundle).
 *
 * Webview-only on purpose. The extension is packaged with `--no-dependencies`,
 * so anything the host requires at runtime must be dependency-free — the host
 * merges over its own defaults instead.
 *
 * Two conventions here:
 * - Every field carries a `.catch()`, so parsing always yields a usable value
 *   rather than throwing and blanking the editor.
 * - `.meta()` comes *after* `.catch()`. `.catch()` returns a fresh schema that
 *   does not inherit the inner schema's registry entry, so metadata applied
 *   first is silently dropped.
 */

// Zod feature-detects its JIT-compiled parser by calling `new Function('')` in
// a try/catch. The webview's CSP blocks that, so zod already falls back — but
// the attempt still raises a `securitypolicyviolation` the host logs as an
// error. Opting out up front keeps that channel meaningful.
z.config({ jitless: true })

const themeSchema = z
	.enum(['dark', 'light', 'system'])
	.catch(DEFAULT_VIEW_OPTIONS.theme)
	.meta({
		id: 'Theme',
		title: 'Theme',
		description:
			'Colour scheme for the editor surface. "system" follows the OS preference.',
		examples: ['dark', 'light', 'system'],
	})

export const viewOptionsSchema = z
	.object({
		raw: z.boolean().catch(DEFAULT_VIEW_OPTIONS.raw).meta({
			title: 'Raw markdown',
			description:
				'Show the unrendered markdown source instead of the WYSIWYG editor.',
		}),
		fullWidth: z.boolean().catch(DEFAULT_VIEW_OPTIONS.fullWidth).meta({
			title: 'Full width',
			description:
				"Let content fill the viewport, overriding the prose plugin's 65ch cap.",
		}),
		theme: themeSchema,
		textTools: z.boolean().catch(DEFAULT_VIEW_OPTIONS.textTools).meta({
			title: 'Text tools',
			description:
				'Show the writing-checks sidebar next to the document. Turning it on is what loads the retext bundle.',
		}),
		// Unknown ids are filtered out rather than failing the array, which a
		// `z.enum` would do - a single stale id would then reset the whole
		// selection to "everything on" instead of degrading to what still exists.
		textToolRules: z
			.array(z.string())
			.transform((ids) =>
				TEXT_TOOL_RULE_IDS.filter((ruleId) => ids.includes(ruleId))
			)
			.catch(DEFAULT_VIEW_OPTIONS.textToolRules)
			.meta({
				title: 'Text tool rules',
				description:
					'Which checks the sidebar runs. Normalised to the canonical rule order, with ids this build does not know dropped.',
			}),
	})
	.catch(DEFAULT_VIEW_OPTIONS)
	.meta({
		id: 'ViewOptions',
		title: 'View options',
		description:
			'User-toggleable view state. Persisted in the host\'s globalState and broadcast to every open editor tab, so it survives reloads and stays in sync across tabs. Also settable from the "Toggle raw markdown", "Toggle full width", "Toggle text tools" and "Select theme" commands.',
	})

const extensionSettingsSchema = z
	.object({
		centerContent: z.boolean().catch(DEFAULT_SETTINGS.centerContent).meta({
			title: 'Center content',
			description:
				'Center the content horizontally when full width is off. Maps to `editorMarkdownNotes.centerContent`.',
		}),
		hideNav: z.boolean().catch(DEFAULT_SETTINGS.hideNav).meta({
			title: 'Hide nav',
			description:
				'Hide the top navigation bar. The toggles remain reachable from the command palette. Maps to `editorMarkdownNotes.hideNav`.',
		}),
		textToolsTargetAge: z
			.number()
			.int()
			.min(5)
			.max(30)
			.catch(DEFAULT_SETTINGS.textToolsTargetAge)
			.meta({
				title: 'Text tools target age',
				description:
					'Reading age the readability check scores against. Maps to `editorMarkdownNotes.textToolsTargetAge`.',
			}),
	})
	.catch(DEFAULT_SETTINGS)
	.meta({
		id: 'ExtensionSettings',
		title: 'Extension settings',
		description:
			'Read-only in the webview — owned by VS Code Settings under the `editorMarkdownNotes` section and pushed down by the host.',
	})

export const configSchema = z
	.object({
		settings: extensionSettingsSchema,
		viewOptions: viewOptionsSchema,
	})
	.catch({ settings: DEFAULT_SETTINGS, viewOptions: DEFAULT_VIEW_OPTIONS })
	.meta({
		id: 'Config',
		title: 'Initial config',
		description:
			'Injected into the page as `window.initialConfig` before the bundle runs, so the first render already has the right theme and width.',
	})

export const configMessageSchema = z
	.object({
		type: z.literal('config'),
		settings: extensionSettingsSchema,
		viewOptions: viewOptionsSchema,
	})
	.meta({
		id: 'ConfigMessage',
		title: 'Config broadcast',
		description:
			"Posted by the host to every open panel whenever the settings or the stored view options change. Unlike the schemas above this one has no `.catch()` — a message that fails to parse is another extension's traffic and must be ignored, not defaulted.",
	})
