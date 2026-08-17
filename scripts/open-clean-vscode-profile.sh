#!/usr/bin/env bash
set -euo pipefail

# Launch a clean VSCode instance with Editor Markdown Notes installed, for
# taking screenshots. Everything lives in a throwaway profile under /tmp, so
# your normal VSCode settings and extensions are untouched.
#
# The profile is discarded and rebuilt on every run, so the window always looks
# the same. Nothing you change inside it survives - that is the point.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLEAN="/tmp/vscode-clean"
USER_DIR="$CLEAN/user"
EXT_DIR="$CLEAN/ext"

# Always start from nothing. VSCode remembers window layout per workspace,
# and restored state beats the *.defaultVisibility settings below - reusing
# the profile is what leaves the Chat sidebar on screen.
#
# Kill any process still running against this profile first: `code` talks to
# an already-running instance over a socket keyed by --user-data-dir, and
# that socket outlives `rm -rf` - a prior run that errored out before its own
# cleanup leaves a zombie instance later runs would silently reattach to.
pkill -f "$USER_DIR" 2>/dev/null || true
rm -rf "$CLEAN"

command -v code >/dev/null || {
  echo "The 'code' CLI is not on PATH. In VSCode: Cmd+Shift+P -> 'Shell Command: Install code command in PATH'" >&2
  exit 1
}

# Seed the profile settings before first launch, so there is no Welcome tab and
# no workspace-trust prompt to dismiss. Drop the activityBar / statusBar /
# layoutControl lines to keep stock VSCode chrome in the shot.
#
# chat.disableAIFeatures removes the title-bar Sign In button and the Open in
# Agents icon; secondarySideBar.defaultVisibility hides the Chat sidebar. The
# Explorer has no equivalent setting - VSCode only auto-hides it for a window
# with no folder open - so close it with Cmd+B after the window appears.
mkdir -p "$USER_DIR/User" "$EXT_DIR"
cat > "$USER_DIR/User/settings.json" <<'JSON'
{
  "workbench.colorTheme": "Default Dark Modern",
  "workbench.startupEditor": "none",
  "workbench.activityBar.location": "hidden",
  "workbench.statusBar.visible": false,
  "workbench.layoutControl.enabled": false,
  "workbench.secondarySideBar.defaultVisibility": "hidden",
  "window.commandCenter": false,
  "chat.disableAIFeatures": true,
  "editor.minimap.enabled": false,
  "security.workspace.trust.enabled": false,
  "window.zoomLevel": 1,
  "extensions.ignoreRecommendations": true,
  "workbench.editorAssociations": {
    "*.md": "editor-markdown-notes.markdownEditor"
  }
}
JSON

# Optional hook for callers (screenshot.sh) that need the extension's own
# view-option toggles (full width, text tools) pre-set - those live in
# globalState, not settings.json. Set to an INSERT for the same sqlite store
# VSCode reads on startup, keyed by extension id (see the caller for the
# key/value shape), not by the individual memento key.
if [ -n "${SEED_GLOBAL_STATE_SQL:-}" ]; then
  command -v sqlite3 >/dev/null || {
    echo "SEED_GLOBAL_STATE_SQL is set but the 'sqlite3' CLI is not on PATH." >&2
    exit 1
  }
  mkdir -p "$USER_DIR/User/globalStorage"
  sqlite3 "$USER_DIR/User/globalStorage/state.vscdb" "
    CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);
    $SEED_GLOBAL_STATE_SQL
  "
fi

cd "$ROOT"
pnpm build
pnpm dlx @vscode/vsce package --no-dependencies

VERSION="$(node -p "require('$ROOT/package.json').version")"
VSIX="$ROOT/editor-markdown-notes-$VERSION.vsix"
[ -f "$VSIX" ] || {
  echo "Expected $VSIX, not found" >&2
  exit 1
}

# --force so re-running after a rebuild replaces the installed copy.
code --user-data-dir "$USER_DIR" --extensions-dir "$EXT_DIR" \
  --install-extension "$VSIX" --force

# Which note to open defaults to the general markdown-syntax fixture; pass a
# path (e.g. from scripts/screenshot.sh) to open a different one instead.
NOTE="${1:-$ROOT/public/notes.md}"

# Open the repo as the workspace folder - root-absolute image paths in the demo
# notes resolve against it - with a note already open in the custom editor.
code --user-data-dir "$USER_DIR" --extensions-dir "$EXT_DIR" \
  --new-window "$ROOT" "$NOTE"
