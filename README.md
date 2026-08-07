# Editor Markdown Notes

A VS Code markdown WYSIWYG editor with live preview, built on [TipTap](https://tiptap.dev).

![A VSCode window editing markdown with Editor Markdown Notes](https://raw.githubusercontent.com/larsmagnus/editor-markdown-notes/main/public/screenshot-editor-markdown-notes.png)

## Why

- Plain markdown is ideal for editing but not for reading. I wanted one tool that excels at both without compromising on either.
- There's more markdown than ever in development—specs, prompts, agent definitions, and config. A better writing and reading experience matters.
- I love [Obsidian](https://obsidian.md) but prefer not switching windows.

## Features

- WYSIWYG markdown editing as a VS Code custom editor for `*.md`
- Formatting toolbar plus a selection bubble menu (headings, text styles, colors, links)
- Tables, task lists and images render inline; YAML frontmatter is edited as raw text in its own panel, kept out of the document
- Mermaid diagrams render for fenced ` ```mermaid ` code blocks
- Follows the active VS Code color theme
- Writing checks in a sidebar: passive voice, simpler words, weak words, hard-to-read sentences
- Toolbar toggles (raw markdown, full width, text tools, theme) persist across tabs and sessions

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

| Setting                                  | Default | Purpose                                                |
| ---------------------------------------- | ------- | ------------------------------------------------------ |
| `editorMarkdownNotes.hideToolbar`        | `false` | Hide the editor's toolbar                              |
| `editorMarkdownNotes.centerContent`      | `false` | Center the content horizontally when full width is off |
| `editorMarkdownNotes.textToolsTargetAge` | `16`    | Reading age the text tools score sentences against     |

The toolbar toggles are also available from the command palette while the editor
is focused, so they stay reachable with `hideToolbar` turned on:

- **Editor Markdown Notes: Toggle raw markdown**
- **Editor Markdown Notes: Toggle full width**
- **Editor Markdown Notes: Toggle text tools**
- **Editor Markdown Notes: Select theme**

All four are shared across open tabs and persist between sessions.

## Commands

| Command                                    | Title                           | Purpose                                                     |
| ------------------------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `editor-markdown-notes.openFile`           | Open file                       | Pick a markdown file and open it with this editor           |
| `editor-markdown-notes.openMarkdownEditor` | Open with Editor Markdown Notes | Open the active/selected `.md` file with this editor        |
| `editor-markdown-notes.toggleRaw`          | Toggle raw markdown             | Switch between the WYSIWYG editor and the raw markdown text |
| `editor-markdown-notes.toggleFullWidth`    | Toggle full width               | Toggle whether the content fills the available width        |
| `editor-markdown-notes.toggleTextTools`    | Toggle text tools               | Show or hide the writing-checks sidebar                     |
| `editor-markdown-notes.selectTheme`        | Select theme                    | Choose the editor color theme (dark, light, or system)      |
| `editor-markdown-notes.toggleHideToolbar`  | Toggle toolbar                  | Show or hide the toolbar                                    |
| `editor-markdown-notes.showLogs`           | Show logs                       | Open the output channel used to debug a blank panel         |

## Text tools

The text tools sidebar checks the prose as you write, highlighting findings in
the document and listing them alongside it. Click one to jump to it.

| Check         | Flags                                                   |
| ------------- | ------------------------------------------------------- |
| Passive voice | Sentences where the subject receives the action         |
| Simpler words | Long or formal words with plainer equivalents           |
| Weak words    | Filler, hedges and vague intensifiers                   |
| Hard to read  | Sentences above `textToolsTargetAge`, in two severities |

Readability is scored by seven algorithms (Dale–Chall, Flesch, SMOG and others).
A sentence too hard for the target age reads as _hard_; one still too hard six
years later, _very hard_.

Individual checks can be switched off in the panel, and the selection persists.
Nothing is analysed — and none of the analysis code is even downloaded — until
the panel is opened.

## Troubleshooting

If the editor panel loads blank, run **Editor Markdown Notes: Show logs** from
the command palette and check the _Editor Markdown Notes_ output channel — the
webview forwards its errors there.

## Requirements

VS Code `^1.101.0`.

## Install locally

The extension is not published to the Marketplace. To build a `.vsix` and install it into your local VS Code:

```sh
pnpm vscode:install
```

Reload the window (Command Palette → **Developer: Reload Window**) after installing.

To uninstall: `code --uninstall-extension larsmagnus.editor-markdown-notes`.

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

### Running from source

1. Press <kbd>F5</kbd> in VS Code to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select **Open with Editor Markdown Notes**

## Disclaimer

Use or not at your own risk.
