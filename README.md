# Editor Markdown Notes

An integrated live markdown editor for VS Code, built for the AI-first era

![A VSCode window editing markdown with Editor Markdown Notes](https://raw.githubusercontent.com/larsmagnus/editor-markdown-notes/main/public/screenshot-editor-markdown-notes.png)

## Why

- Markdown is ideal for simple editing of plain text, but not for reading or improving the quality of the text. I want one tool that excels at all these without compromising on any.

- There's more markdown than ever in development — specs, prompts, agent definitions, and config. A better writing and reading experience matters

- I love [Obsidian](https://obsidian.md) but prefer not switching windows.

## Features

- Live, raw and text edit modes

- Contextual formatting and editing tools

- Claude Code integration for opening, asking and rewriting

- Writing checks flag passive voice, weak words and hard-to-read sentences

- Text quality checks exposed to AI agents over MCP

- Code blocks and frontmatter editing with syntax highlighting (matches your VS Code theme)

- Table and image editing tools

- Mermaid diagrams render inline

- Toolbar settings persist across tabs and sessions

## Usage

Open the editor in any of these ways:

- Right-click a `.md` file in the Explorer → **Open with Editor Markdown Notes**
- Right-click inside an open markdown file → **Open with Editor Markdown Notes**
- Command Palette → **Editor Markdown Notes: Open file**
- Right-click a `.md` file → **Open With…** → **Editor Markdown Notes**

The default text editor is unchanged; this editor is registered with `priority: "option"`, so you opt in per file.

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

Both templates take the same tokens: `%@` the note as an at-reference (`@notes/roadmap.md`), `%s` its bare path, and `%c` the source of the part being asked about — a diagram's, for the inline template, and nothing for the note-wide one.

The toolbar toggles are available from the command palette while the editor is focused, so they stay reachable with `hideToolbar` turned on.

All of them are shared across open tabs and persist between sessions.

## Commands

| Title                                                  | Command                                        | Purpose                                                                 |
| ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Editor Markdown Notes: Open file                       | `editor-markdown-notes.openFile`               | Pick a markdown file and open it with this editor                       |
| Editor Markdown Notes: Open with Editor Markdown Notes | `editor-markdown-notes.openMarkdownEditor`     | Open the active/selected `.md` file with this editor                    |
| Editor Markdown Notes: Toggle raw markdown             | `editor-markdown-notes.toggleRaw`              | Switch between the WYSIWYG editor and the raw markdown text (persisted) |
| Editor Markdown Notes: Toggle full width               | `editor-markdown-notes.toggleFullWidth`        | Toggle whether the content fills the available width (persisted)        |
| Editor Markdown Notes: Toggle text tools               | `editor-markdown-notes.toggleTextTools`        | Show or hide the writing-checks sidebar (persisted)                     |
| Editor Markdown Notes: Select theme                    | `editor-markdown-notes.selectTheme`            | Choose the editor color theme (persisted)                               |
| Editor Markdown Notes: Select spelling language        | `editor-markdown-notes.selectSpellingLanguage` | Choose the English (US, GB, AU) the spelling check uses (persisted)     |
| Editor Markdown Notes: Add words to dictionary         | `editor-markdown-notes.addDictionaryWords`     | Teach the spelling check custom vocabulary to stop flagging             |
| Editor Markdown Notes: Open in text editor             | `editor-markdown-notes.openInTextEditor`       | Reopen the current file with VSCode's built-in text editor              |
| Editor Markdown Notes: Toggle toolbar                  | `editor-markdown-notes.toggleHideToolbar`      | Show or hide the toolbar                                                |
| Editor Markdown Notes: Show logs                       | `editor-markdown-notes.showLogs`               | Open the output channel used to debug a blank panel                     |

## Text tools

The text tools sidebar checks the prose as you write, highlighting findings in the document and listing them alongside it. Click one to jump to it.

| Check         | Flags                                                   |
| ------------- | ------------------------------------------------------- |
| Passive voice | Sentences where the subject receives the action         |
| Simpler words | Long or formal words with plainer equivalents           |
| Weak words    | Filler, hedges and vague intensifiers                   |
| Hard to read  | Sentences above `textToolsTargetAge`, in two severities |
| Spelling      | Words missing from the English dictionary you pick      |

Readability is scored by seven algorithms (Dale–Chall, Flesch, SMOG and others). A sentence too hard for the target age reads as _hard_; one still too hard six years later, _very hard_.

Spelling is off until you switch it on, and measures against American, British or Australian English — pick one beside the check, or from **Editor Markdown Notes: Select spelling language**. Code blocks and inline code spans are left alone, as are the keys in YAML frontmatter.

Individual checks can be switched off in the panel, and the selection persists. Nothing is analysed — and none of the analysis code is even downloaded — until the panel is opened. The dictionary is a download of its own, fetched the first time spelling is switched on.

### For AI agents

Text quality checks are available to AI agents in the editor over MCP, using your configured reading age, language and custom words list — so an agent judges a note the way the text tools sidebar does. It ships with the extension and needs no setup; accept the editor's prompt to refresh its tools when it first appears.

Ask in plain language ("check this note for passive voice", "which sentences are too hard for a 14-year-old?"). Findings come back with a line number and the sentence they sit in, and the agent makes the edits with its normal tools.

See [`src/mcp/README.md`](src/mcp/README.md) for what it does and why.

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

Uninstall

```sh
code --uninstall-extension larsmagnus.editor-markdown-notes
```

## Development

| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `pnpm dev`            | Vite dev server for the React app standalone  |
| `pnpm build`          | Build the web app and compile the extension   |
| `pnpm vscode:watch`   | Watch-mode compile of the extension host code |
| `pnpm typecheck`      | TypeScript check, no emit                     |
| `pnpm lint`           | Typecheck + `oxlint --fix` + `oxfmt`          |
| `pnpm test`           | Run both suites                               |
| `pnpm test:unit`      | Vitest webview tests                          |
| `pnpm test:extension` | Extension tests via `vscode-test`             |
| `pnpm complexity`     | Check file complexity against the FTA budget  |
| `pnpm knip`           | Find unused files, exports and dependencies   |
| `pnpm storybook`      | Storybook dev server for components           |

### Running from source

1. Press F5 in VS Code to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select **Open with Editor Markdown Notes**

## Disclaimer

Use or not at your own risk.
