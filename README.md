# Editor Markdown Notes

An integrated live markdown editor for VS Code, built for the AI-first era

![A VSCode window editing markdown with Editor Markdown Notes](https://raw.githubusercontent.com/larsmagnus/editor-markdown-notes/main/public/screenshot-editor-markdown-notes.png)

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

### Supported files

- `.md`, `.markdown`, `.mdown`, `.mkd`, `.txt`: open and edit directly
- `.mdx`: opens directly, but JSX, `import`/`export` and `{expression}` blocks show as plain text rather than rendering
- `.pdf`: its text is extracted into a markdown file, which opens instead

## Usage

Open the editor in any of these ways:

- Right-click a supported file in the Explorer → **Open with Editor Markdown Notes**
- Right-click inside an open supported file → **Open with Editor Markdown Notes**
- Command Palette → **Editor Markdown Notes: Open file**
- Right-click a supported file → **Open With…** → **Editor Markdown Notes**

The default text editor is unchanged. This editor is registered with `priority: "option"`, so you opt in per file.

To open a `.pdf`, right-click it → **Open PDF as markdown**, which extracts its text into a markdown file and opens that instead.

### Always open `.md` files with this editor

To make Editor Markdown Notes the default for all markdown files, add an editor association in `settings.json`:

```json
"workbench.editorAssociations": {
  "*.md": "editor-markdown-notes.markdownEditor"
}
```

You can also set this without editing JSON directly: open a `.md` file, right-click its tab → **Configure Default Editor for '\*.md'...** → choose **Editor Markdown Notes**.

## Settings

Available under Settings → Extensions → Editor Markdown Notes (or the cog on the extension page):

| Setting                                          | Default                                                                                              | Purpose                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `editorMarkdownNotes.hideToolbar`                | `false`                                                                                              | Hide the editor's toolbar                                                                                                   |
| `editorMarkdownNotes.centerContent`              | `false`                                                                                              | Center the content horizontally when full width is off                                                                      |
| `editorMarkdownNotes.italicMarker`               | `_`                                                                                                  | Marker (`_` or `*`) used when italicizing text from the editor                                                              |
| `editorMarkdownNotes.textToolsTargetAge`         | `16`                                                                                                 | Reading age the text tools score sentences against                                                                          |
| `editorMarkdownNotes.claudePromptTemplate`       | `Read %@ so I can ask you questions about it.`                                                       | Prompt sent to `claude` by the toolbar's "Open in Claude" action                                                            |
| `editorMarkdownNotes.claudeInlinePromptTemplate` | `Read %@, then focus on the part of it that starts with "%c" so I can ask you questions about that.` | Prompt sent by "Open in Claude" on one part of a note, such as a diagram                                                    |
| `editorMarkdownNotes.imageCopyDirectory`         | `assets`                                                                                             | Where the slash command's "image" action copies a file picked from outside the workspace, relative to the document's folder |
| `editorMarkdownNotes.index.exclude`              | `[]`                                                                                                 | Glob patterns for notes to leave out of the index, such as `**/archive/**`                                                  |

Both templates take the same tokens: `%@` the note as an at-reference (`@notes/roadmap.md`), `%s` its bare path, and `%c` the source of the part being asked about. For the inline template that is a diagram's source, and the note-wide one has none.

The toolbar toggles are available from the command palette while the editor is focused, so they stay reachable with `hideToolbar` turned on.

All of them are shared across open tabs and persist between sessions.

## Commands

| Title                                                  | Command                                        | Purpose                                                                 |
| ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Editor Markdown Notes: Open file                       | `editor-markdown-notes.openFile`               | Pick a markdown file and open it with this editor                       |
| Editor Markdown Notes: Open with Editor Markdown Notes | `editor-markdown-notes.openMarkdownEditor`     | Open the active/selected supported file with this editor                |
| Editor Markdown Notes: Toggle raw markdown             | `editor-markdown-notes.toggleRaw`              | Switch between the WYSIWYG editor and the raw markdown text (persisted) |
| Editor Markdown Notes: Toggle full width               | `editor-markdown-notes.toggleFullWidth`        | Toggle whether the content fills the available width (persisted)        |
| Editor Markdown Notes: Toggle text tools               | `editor-markdown-notes.toggleTextTools`        | Show or hide the writing-checks sidebar (persisted)                     |
| Editor Markdown Notes: Select theme                    | `editor-markdown-notes.selectTheme`            | Choose the editor color theme (persisted)                               |
| Editor Markdown Notes: Select spelling language        | `editor-markdown-notes.selectSpellingLanguage` | Choose the English (US, GB, AU) the spelling check uses (persisted)     |
| Editor Markdown Notes: Add words to dictionary         | `editor-markdown-notes.addDictionaryWords`     | Teach the spelling check custom vocabulary to stop flagging             |
| Editor Markdown Notes: Open in text editor             | `editor-markdown-notes.openInTextEditor`       | Reopen the current file with VSCode's built-in text editor              |
| Editor Markdown Notes: Toggle toolbar                  | `editor-markdown-notes.toggleHideToolbar`      | Show or hide the toolbar                                                |
| Editor Markdown Notes: Show logs                       | `editor-markdown-notes.showLogs`               | Open the output channel used to debug a blank panel                     |
| Editor Markdown Notes: Open PDF as markdown            | `editor-markdown-notes.openPdfAsNotes`         | Extract a PDF's text into a markdown file and open it                   |
| Editor Markdown Notes: Open index                      | `editor-markdown-notes.openIndex`              | Browse, filter and sort every note in the workspace                     |

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
- **Spelling:** off by default. Pick American, British or Australian English beside the check, or with **Editor Markdown Notes: Select spelling language**
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

If you experience issues with the extension, run **Editor Markdown Notes: Show logs** from the command palette and check the _Editor Markdown Notes_ output channel.

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
code --uninstall-extension larsmagnus.editor-markdown-notes
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
3. Right-click the file and select **Open with Editor Markdown Notes**

## Disclaimer

Use or not at your own risk.
