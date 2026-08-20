import { EXTENSION_ID } from '../shared/constants'

/**
 * Host-only identifiers, built from the shared `EXTENSION_ID`.
 *
 * These stay here rather than in `src/shared/` because nothing but the host and
 * its test suites has any use for them - a view type, a configuration section
 * and a `globalState` key are all things only the host can act on.
 */
export const VIEW_TYPE = `${EXTENSION_ID}.markdownEditor`

export const CONFIG_SECTION = 'editorMarkdownNotes'

export const VIEW_OPTIONS_KEY = 'editorMarkdownNotes.viewOptions'

/**
 * Must match the `contributes.mcpServerDefinitionProviders` entry in
 * `package.json` - `registerMcpServerDefinitionProvider` throws if the id it is
 * given was never contributed.
 */
export const MCP_PROVIDER_ID = `${EXTENSION_ID}.text-tools`
