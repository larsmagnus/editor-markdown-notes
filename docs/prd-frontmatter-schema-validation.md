# PRD: Frontmatter schema validation

Status: draft · Target: v1 of the feature, live editing mode only

## Problem

Markdown frontmatter is how the AI-assisted development ecosystem carries structured
configuration — `SKILL.md`, subagent definitions, `.claude/rules/*.md`, and the same
pattern across every static site generator. Authors get no help with it. The field is
freeform text in a `<pre>`: no completion, no field documentation, no indication that a
key is misspelt or a value outside its allowed set, until the consuming tool fails or
silently ignores the file.

Nothing in the editor ecosystem closes this. The Red Hat YAML extension, which owns
schema-driven YAML editing in VS Code, does not see frontmatter in markdown at all — the
request has been open for years. A markdown editor built for this era of development
should be the place this works.

## Goal

Resolve a JSON Schema for the frontmatter block being edited, and use it to drive
completion and field documentation inside the live editor. Do it through binding
conventions that already exist elsewhere, so the feature interoperates rather than
inventing a private format.

Validation, linting, pre-filling and quick fixes all read from the same resolved schema.
They are out of scope here, but the resolution layer is designed to serve them.

### Non-goals

- Frontmatter support in VS Code's ordinary text editor. That is a different surface
  needing host-side language providers.
- TOML (`+++`) and JSON frontmatter. Detected and ignored, never crashed on.
- Completion inside the string mini-DSLs some fields accept (tool patterns such as
  `Bash(git:*)`). JSON Schema cannot express them.

## Prior art

No ratified standard for binding a schema to frontmatter exists. Three conventions have
real implementations, and adopting all three in a fixed precedence covers the field:

| Convention                                       | Where it comes from                                                                        | Cost                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `# yaml-language-server: $schema=<uri>` modeline | Documented and implemented by yaml-language-server; honoured by the Red Hat YAML extension | None — a YAML comment is invisible to every parser |
| `$schema:` key in the frontmatter                | JSON instance-document convention; remark-lint-frontmatter-schema; Front Matter CMS        | Pollutes the data                                  |
| Glob-to-schema settings map                      | `yaml.schemas`, shipped in every VS Code install                                           | None                                               |

The modeline leads, because the alternative is not free. The Agent Skills specification
defines a closed field set for `SKILL.md`, so a `$schema:` key makes such a file
spec-invalid and shows up as an unknown key to strict consumers, the specification's own
reference validator included. A comment carries the same information and survives every
consumer untouched.

SchemaStore is not a source of bindings here: of its schemas, none match a markdown file.
Its published Claude Code schemas cover only JSON files — settings, keybindings, plugin
and marketplace manifests. There is no schema anywhere for `SKILL.md`, subagents, or
rules, which is why shipping our own is a requirement rather than a nicety.

## Requirements

### R1 — Frontmatter YAML range

Locate the YAML inside a frontmatter node, tolerant of the block being mid-edit.

The editor already parses this range, and already tolerates a block with no closing fence
or no content — this requirement builds nothing new for the cases that look hardest. What
is left is offsetting that range by the node's document position, so language-service
positions map back to the right place in the document.

Acceptance: a position round-trips from document offset to YAML offset and back, for a
block with no closing fence, an empty block, and a block containing `---` in a value.

### R2 — Schema resolution

Resolve one schema per frontmatter block, by this precedence:

1. `# yaml-language-server: $schema=` modeline inside the block
2. `$schema:` key inside the block
3. A user settings glob match
4. A bundled default glob match

Within the glob tiers, the most specific pattern wins — longest literal prefix — so the
result never depends on object key order. A pattern with no `/` is promoted to `**/`, so
`SKILL.md` means what an author expects.

Resolution reports which tier produced the result, because misconfiguration is otherwise
undebuggable.

Acceptance: a file matched by both a user glob and a bundled glob resolves to the user's;
a modeline beats every glob; two overlapping globs resolve deterministically regardless of
declaration order.

### R3 — Schema sources

Load schemas from four places: bundled in the extension, workspace-relative (`./…`),
home-relative (`~/…`), and remote (`https://…`).

Remote fetching is gated on VS Code Workspace Trust and an allowlist of hosts, because a
modeline is author-controlled content in a file that may come from an untrusted
repository, and fetching it is an outbound request on file open. Fetches are cached to
disk so the feature works offline after first use.

Acceptance: an untrusted workspace resolves bundled and relative schemas but never
fetches; a non-allowlisted host prompts rather than fetching silently.

### R4 — Settings

Two settings under the existing `punchdown` contribution:

```jsonc
"punchdown.frontmatterSchemaDefaults": true,
"punchdown.frontmatterSchemas": {
  "https://…/claude-code-skill.json": ["**/skills/*/SKILL.md"],
  "./schemas/post.json": ["content/blog/**/*.md"],
  "~/schemas/agent.json": ["**/.claude/agents/*.md"],
  "https://…/bundled-rule.json": null
}
```

Schema as key, globs as value — the `yaml.schemas` shape, so the format is already
familiar and can itself be schema-described in the contribution.

VS Code replaces object-valued settings wholesale rather than merging them across scopes.
A user who adds one binding would otherwise silently lose every bundled binding, so the
bundled set lives behind its own boolean and is merged under the user's map. A `null`
value disables a single bundled entry without disabling the rest.

Acceptance: a user map containing one entry still resolves bundled schemas; setting an
entry to `null` disables only that binding; turning the defaults off leaves only user
entries.

### R5 — Language features

Completion of keys and of enumerated values, and hover carrying each field's
documentation, inside the frontmatter block.

`yaml-language-server` is consumable as a library and already implements all of this
against a schema, modeline handling included. It is fed the block's YAML as a standalone
document; its positions are offset per R1.

The popup is ours to build. A node view gets completion items, not a widget — there is no
VS Code or Monaco completion UI reachable from inside the webview. It anchors at the caret
within the block, measuring rectangles rather than using floating-ui — the editor's other
anchored surfaces already do, because a layout-engine-free test environment can observe a
measured rectangle and cannot observe a positioned one.

Acceptance: typing a partial key offers the schema's matching properties; a field with an
enumerated type offers its values; hovering a known key shows its description; none of it
fires outside a frontmatter block.

### R6 — Bundled schemas

R1 through R5 build an engine. Without schemas to resolve, it does nothing on install, and
none exist to point at. So v1 ships JSON Schema files inside the `.vsix` for `SKILL.md`,
subagent definitions, and rules files. These are the bindings R4's defaults toggle
controls.

Their content is generated, not hand-transcribed. Claude Code's documentation is served as
raw markdown, and each file type's frontmatter fields are documented as a table of field,
required, and description. A build script parses those tables into JSON Schema and the
output is committed; the description column becomes hover text in the completion UI.
Regenerating when upstream adds a field is a reviewed diff, never a runtime fetch.

Acceptance: the generator produces schemas from a pinned documentation revision, and its
output is committed and loadable. Curated overlays supply what prose cannot express —
enumerated values, and the fields accepting either a delimited string or a list.

### R7 — Resolved-schema indicator

A badge in the frontmatter block's header row, alongside the existing copy, edit-source
and delete actions. `Braces` icon, distinct from the `Code` icon that row already uses.
Its tooltip names the resolved schema and the tier that produced it.

Acceptance: the badge is absent when nothing resolves, and its tooltip distinguishes a
modeline-resolved schema from a glob-resolved one.

## Architecture

The language service runs in the webview, where Vite bundles it. The host supplies what
the webview cannot reach itself: settings, workspace and home file reads, and remote
fetches — the webview's CSP admits no external host. Schemas travel over the existing
host-to-webview message contract, the way configuration already does.

Two constraints shape the dependency choice. The host build treats only `vscode` and its
ESM loader shim as external, so an ESM-only package reaching the host needs the separate
externals bundle and its loader rather than a plain import. And zod stays out of the host
per the project's own rule, which is a second reason validation belongs on the webview
side of the boundary.

## Risks and quirks

| Quirk                                                                                                                                                   | Consequence                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills have two disagreeing authorities: the specification requires `name` and closes the field set; Claude Code makes it optional and adds many fields | One schema cannot serve both. v1 ships the Claude Code variant; the strict variant is a later addition needing no new mechanism, since an author just points a glob at it |
| YAML coerces where JSON Schema expects literals — `no` reading as `false` under YAML 1.1, dates becoming objects, octal-looking strings                 | Pin the YAML 1.2 core schema and cover these cases explicitly                                                                                                             |
| Fields accepting either a delimited string or a YAML list                                                                                               | Expressible only as a union, and completion cannot reach inside the string form                                                                                           |
| JSON Schema dialects differ across sources                                                                                                              | Decide draft support up front; it determines the validator build and leaks into the loader                                                                                |
| Globs must resolve against something                                                                                                                    | Workspace root, with multi-root workspaces and platform case sensitivity settled in R2's tests rather than discovered later                                               |

## Deferred

Validation diagnostics · linting · pre-filling required fields and defaults · quick fixes ·
the strict Agent Skills schema variant · completion inside string mini-DSLs · host-side
providers for the ordinary text editor · CI-time frontmatter linting.

## Open questions

- Which JSON Schema drafts to support.
- Whether the bundled schemas are also published for others to reference, and whether a
  markdown `fileMatch` is worth proposing to SchemaStore, which has no such precedent.

## Test plan

Red-phase tests precede implementation, per the project's practice.

Unit tests carry the pure layers, where the defects are cheapest to find: position
round-tripping (R1), precedence and glob specificity (R2), and settings merging including
the `null` disable (R4). Each requirement's acceptance criteria above enumerate the cases.

Integration tests cover the node view resolving a schema and rendering the badge. The
completion popup's keyboard behaviour belongs in `e2e/`, since keystrokes and caret
position are not observable from vitest.

Host behaviour — trust gating, allowlisting, caching — is only checkable in a real VS Code
instance, so it belongs to the extension suite.
