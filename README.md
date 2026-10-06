<div align="center">
  <img src="https://raw.githubusercontent.com/larsmagnus/punchdown/main/public/icon-punchdown.svg" alt="punchdown logo" width="64" height="64" />
  <h1>punchdown_</h1>
  <p>An integrated live markdown editor for VS Code, built for the AI-first era</p>
</div>

![A VSCode window editing markdown with punchdown](https://raw.githubusercontent.com/larsmagnus/punchdown/main/public/screenshot-punchdown.png)

## Why

- Markdown suits writing, not reading or refining. One tool must do all three
- Specs, prompts, agent definitions and config are markdown and deserve a focused experience
- Staying in VS Code keeps your notes, code and Claude side by side, so you stay in the flow

## Features

- Live, raw and text edit modes
- Slash commands for diagrams, code blocks, task lists, tables and images
- Editable markdown syntax, revealed only under the caret
- Typing shortcuts: wrap a selection in backticks, asterisks, underscores, tildes or quotes, or paste a URL over text to make a link
- Claude Code integration for opening, asking and rewriting
- Writing checks flag passive voice, weak words, hard-to-read sentences and misspellings
- Sentiment analysis flags emotionally charged words and scores the tone of the whole note
- Document stats and an overall readability score
- Text quality checks exposed to AI agents over MCP
- First-class frontmatter support: edit YAML in a dedicated block with syntax highlighting, add, copy or delete it in one click, or type it by hand
- Code blocks with syntax highlighting (matches your VS Code theme)
- Table and image editing tools
- Mermaid diagrams render inline and support visual editing
- draw.io support: `.drawio.svg` images render inline and copy as mermaid flowcharts, and mermaid diagrams copy back to draw.io
- Copy a note as markdown or plain text, and a diagram as source or SVG
- Note index of every note in the workspace, with filtering and sorting by title, folder, tag or last edit
- Toolbar settings persist across tabs and sessions

Edit in the live view and the markdown stays yours: switch to the raw editor any time to see and edit the exact file, with syntax highlighting and your undo history intact.

![The raw markdown editor](https://raw.githubusercontent.com/larsmagnus/punchdown/main/public/screenshot-raw-editor.png)

Mermaid diagrams render inline. Open the visual editor to add, connect, rename and delete nodes, and the diagram's source follows along.

![Editing a mermaid diagram visually](https://raw.githubusercontent.com/larsmagnus/punchdown/main/public/screenshot-mermaid-visual-editing.png)

Select text and press Ask Claude to simplify, shorten, improve or rewrite it. The reply appears in place, ready to accept, decline or redo.

![The Ask Claude popover over selected text](https://raw.githubusercontent.com/larsmagnus/punchdown/main/public/screenshot-ask-claude.png)

### Supported files

- `.md`, `.markdown`, `.mdown`, `.mkd`, `.txt`: open and edit directly
- `.mdx`: opens directly, but JSX, `import`/`export` and `{expression}` blocks show as plain text rather than rendering
- `.pdf`: its text is extracted into a markdown file, which opens instead

## Usage

Open the editor in any of these ways:

- Right-click a supported file in the Explorer → **Open with punchdown**
- Right-click inside an open supported file → **Open with punchdown**
- Command Palette → **punchdown: Open file**
- Right-click a supported file → **Open With…** → **punchdown**

The default text editor is unchanged. This editor is registered with `priority: "option"`, so you opt in per file.

To open a `.pdf`, right-click it → **Open PDF as markdown**, which extracts its text into a markdown file and opens that instead.

### Always open `.md` files with this editor

To make punchdown the default for all markdown files, add an editor association in `settings.json`:

```json
"workbench.editorAssociations": {
  "*.md": "punchdown.markdownEditor"
}
```

You can also set this without editing JSON directly: open a `.md` file, right-click its tab → **Configure Default Editor for '\*.md'...** → choose **punchdown**.

## Settings

Available under Settings → Extensions → punchdown (or the cog on the extension page):

| Setting                                | Default                                                                                              | Purpose                                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `punchdown.hideToolbar`                | `false`                                                                                              | Hide the editor's toolbar                                                                                                   |
| `punchdown.lineNumbers`                | `true`                                                                                               | Show line numbers in the raw markdown editor                                                                                |
| `punchdown.centerContent`              | `false`                                                                                              | Center the content horizontally when full width is off                                                                      |
| `punchdown.italicMarker`               | `_`                                                                                                  | Marker (`_` or `*`) used when italicizing text from the editor                                                              |
| `punchdown.textToolsTargetAge`         | `16`                                                                                                 | Reading age the text tools score sentences against                                                                          |
| `punchdown.claudePromptTemplate`       | `Read %@ so I can ask you questions about it.`                                                       | Prompt sent to `claude` by the toolbar's "Open in Claude" action                                                            |
| `punchdown.claudeInlinePromptTemplate` | `Read %@, then focus on the part of it that starts with "%c" so I can ask you questions about that.` | Prompt sent by "Open in Claude" on one part of a note, such as a diagram                                                    |
| `punchdown.imageCopyDirectory`         | `assets`                                                                                             | Where the slash command's "image" action copies a file picked from outside the workspace, relative to the document's folder |
| `punchdown.index.exclude`              | `[]`                                                                                                 | Glob patterns for notes to leave out of the index, such as `**/archive/**`                                                  |

Both templates take the same tokens: `%@` the note as an at-reference (`@notes/roadmap.md`), `%s` its bare path, and `%c` the source of the part being asked about. For the inline template that is a diagram's source, and the note-wide one has none.

The toolbar toggles are available from the command palette while the editor is focused, so they stay reachable with `hideToolbar` turned on.

All of them are shared across open tabs and persist between sessions.

## Commands

| Title                               | Command                            | Purpose                                                                 |
| ----------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| punchdown: Open file                | `punchdown.openFile`               | Pick a markdown file and open it with this editor                       |
| punchdown: Open with punchdown      | `punchdown.openMarkdownEditor`     | Open the active/selected supported file with this editor                |
| punchdown: Toggle raw markdown      | `punchdown.toggleRaw`              | Switch between the WYSIWYG editor and the raw markdown text (persisted) |
| punchdown: Toggle full width        | `punchdown.toggleFullWidth`        | Toggle whether the content fills the available width (persisted)        |
| punchdown: Toggle text tools        | `punchdown.toggleTextTools`        | Show or hide the writing-checks sidebar (persisted)                     |
| punchdown: Select theme             | `punchdown.selectTheme`            | Choose the editor color theme (persisted)                               |
| punchdown: Select spelling language | `punchdown.selectSpellingLanguage` | Choose the English (US, GB, AU) the spelling check uses (persisted)     |
| punchdown: Add words to dictionary  | `punchdown.addDictionaryWords`     | Teach the spelling check custom vocabulary to stop flagging             |
| punchdown: Open in text editor      | `punchdown.openInTextEditor`       | Reopen the current file with VSCode's built-in text editor              |
| punchdown: Toggle toolbar           | `punchdown.toggleHideToolbar`      | Show or hide the toolbar                                                |
| punchdown: Toggle line numbers      | `punchdown.toggleLineNumbers`      | Show or hide the raw editor's line numbers                              |
| punchdown: Show logs                | `punchdown.showLogs`               | Open the output channel used to debug a blank panel                     |
| punchdown: Open PDF as markdown     | `punchdown.openPdfAsNotes`         | Extract a PDF's text into a markdown file and open it                   |
| punchdown: Open index               | `punchdown.openIndex`              | Browse, filter and sort every note in the workspace                     |

## Text tools

The text tools sidebar checks the prose as you write, highlighting findings in the document and listing them alongside it. Click one to jump to it.

| Check          | Flags                                                   |
| -------------- | ------------------------------------------------------- |
| Passive voice  | Sentences where the subject receives the action         |
| Simpler words  | Long or formal words with plainer equivalents           |
| Weak words     | Filler, hedges and vague intensifiers                   |
| Hard to read   | Sentences above `textToolsTargetAge`, in two severities |
| Spelling       | Words missing from the English dictionary you pick      |
| Sentiment      | Emotionally charged words, plus the note's overall tone |
| Repeated words | The same word typed twice in a row                      |
| Dash overuse   | Sentences overusing em and en dashes                    |

- **Readability:** scored by seven algorithms. A sentence is _hard_ above the target age and _very hard_ six years above it
- **Spelling:** off by default. Pick American, British or Australian English beside the check, or with **punchdown: Select spelling language**
- **Skipped:** code blocks, inline code and YAML frontmatter keys
- **Toggles:** switch checks off individually. Your choice persists
- **Lazy:** nothing loads until you open the panel, and the dictionary downloads when you first enable spelling

### For AI agents

Agents in the editor run the same checks over MCP, using your reading age, language and custom words. No setup. Accept the editor's prompt to refresh its tools.

- Ask in plain language: "check this note for passive voice"
- Findings include the line number and sentence
- The agent makes the edits itself

See [`src/mcp/README.md`](src/mcp/README.md) for details.

## Troubleshooting

If you experience issues with the extension, run **punchdown: Show logs** from the command palette and check the _punchdown_ output channel.

## Requirements

- VS Code `^1.101.0`.
- (Optional) [Claude Code CLI](https://claude.com/product/claude-code) installed and signed in on `$PATH`

## Install locally

The extension is not published to the Marketplace. To build a `.vsix` and install it into your local VS Code:

```sh
pnpm vscode:install
```

Reload the window (Command Palette → **Developer: Reload Window**) after installing.

To uninstall:

```sh
code --uninstall-extension larsmagnus.punchdown
```

## Development

| Command                  | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `pnpm dev`               | Vite dev server for the React app standalone        |
| `pnpm build`             | Build the web app and compile the extension         |
| `pnpm vscode:watch`      | Watch-mode compile of the extension host code       |
| `pnpm typecheck`         | TypeScript check, no emit                           |
| `pnpm lint`              | Typecheck + `oxlint --fix` + `oxfmt`                |
| `pnpm lint:check`        | Typecheck + `oxlint` + `oxfmt --check`, no fixes    |
| `pnpm verify`            | Lint with fixes, then complexity, duplication, knip |
| `pnpm verify:check`      | Every static gate, read-only. What CI runs          |
| `pnpm test`              | Run all three suites                                |
| `pnpm test:unit`         | Vitest webview tests                                |
| `pnpm test:watch`        | Vitest in watch mode                                |
| `pnpm test:extension`    | Extension tests via `vscode-test`                   |
| `pnpm test:e2e`          | Playwright browser tests                            |
| `pnpm screenshot`        | Regenerate the README screenshot                    |
| `pnpm complexity`        | Fail when a file exceeds the FTA budget             |
| `pnpm duplication`       | Report copy-pasted code with `jscpd`                |
| `pnpm duplication:check` | Fail above the duplication threshold                |
| `pnpm knip`              | Find unused files, exports and dependencies         |
| `pnpm storybook`         | Storybook dev server for components                 |
| `pnpm storybook:build`   | Static Storybook build                              |

### Running from source

1. Press F5 in VS Code to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select **Open with punchdown**

## Disclaimer

Use or not at your own risk.
