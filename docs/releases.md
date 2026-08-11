# Releases

A release is an annotated `vX.Y.Z` tag on `main`. Pushing that tag runs `.github/workflows/release.yml`, which re-runs the full check suite against the tagged tree, packages the extension, and creates a GitHub Release carrying the `.vsix` and that version's changelog section as its notes.

The tag is the source of truth. `main` moving does not ship anything.

## Cutting a release

1. In `CHANGELOG.md`, move the `[Unreleased]` items under a new `## [X.Y.Z] - YYYY-MM-DD` heading and leave a fresh empty `## [Unreleased]` above it. Commit.
2. `pnpm release patch` (or `minor` / `major`) — bumps `package.json`, commits `chore(release): X.Y.Z`, and creates the tag.
3. `git push --follow-tags`
4. Watch the run: `gh run watch`.

The changelog heading must match the tag, or the workflow fails at the notes step rather than publishing an empty release.

### Which bump

Patch for fixes only. Minor for anything a user would notice as new — a feature, a new setting, or a renamed or removed one. The changelog already reads this way: an entry starting "Fixed" is a patch, "Added" or "Changed" is a minor.

## Tags are immutable

Never move or reuse a tag. Anyone who has fetched it keeps the old target regardless of what the remote says, so a moved tag means two people building different code under one name. If a release is wrong, ship the next patch.

The one exception is a tag pushed seconds ago that nobody could have fetched:

```bash
git tag -d vX.Y.Z
git push --delete origin vX.Y.Z
```

## When the workflow fails

The tag is already pushed by the time CI runs — that is the cost of tagging locally. Delete it with the commands above, fix the problem on `main`, and tag again. No GitHub Release exists until the final step succeeds, so a failed run leaves nothing half-published.

## Branching

Unchanged: short-lived branches off `main`, merged back, and `main` is what gets tagged. Only tag `main` — a tag on a feature branch pins a commit that may never merge and would build a release from unreviewed code.

If a shipped version ever needs a fix while `main` has moved on, branch from the tag rather than reverting `main`:

```bash
git switch -c release/0.18.x v0.18.0
# cherry-pick the fix, bump, tag v0.18.1
```

This has not been needed yet — every user installs the newest build — but the tags are what make it possible.

## History

Tags before `v0.17.0` were backfilled after the fact. Until then the version bump happened alongside the feature work rather than in its own `chore(release)` commit, so those tags mark the commit where the version was declared. Their dates match the changelog; the exact tree that shipped is approximate.
