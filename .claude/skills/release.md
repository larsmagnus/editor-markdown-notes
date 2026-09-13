# Release Skill

Guides through cutting a release by bumping the version, updating the changelog, and pushing the tag to trigger CI.

## Prerequisites

- Working directory is clean: `git status` shows no uncommitted changes
- You're on the `main` branch

## Steps

### 1. Verify quality locally

Run the full check suite before cutting the release:

```bash
pnpm lint
pnpm test
```

If either fails, fix the issues on `main` and commit before proceeding.

### 2. Update the changelog

Open `CHANGELOG.md` and:

- Move all `[Unreleased]` items under a new `## [X.Y.Z] - YYYY-MM-DD` heading
- Use today's date in `YYYY-MM-DD` format
- Leave a fresh empty `## [Unreleased]` section above it
- Commit the change

**Version choice** — use `pnpm release --dry-run` to see what would bump, then pick:

- `patch`: fixes only (changelog entries start with "Fixed")
- `minor`: features, settings, or renames (entries start with "Added" or "Changed")
- `major`: breaking changes

### 3. Bump the version and create the tag

Run one of:

```bash
pnpm release patch
pnpm release minor
pnpm release major
```

This:

- Bumps `package.json`
- Creates a commit `chore(release): X.Y.Z`
- Creates an annotated tag `vX.Y.Z`

### 4. Push the tag

```bash
git push --follow-tags
```

### 5. Watch the workflow

```bash
gh run watch
```

The GitHub Actions workflow re-runs the full check suite against the tagged tree, packages the `.vsix`, and creates the GitHub Release with the changelog section as its notes.

**Release is complete** when the workflow passes and the GitHub Release is published.

## Troubleshooting

### Tag pushed but workflow failed

The tag is already remote — delete it, fix the problem on `main`, and tag again:

```bash
git tag -d vX.Y.Z
git push --delete origin vX.Y.Z
```

Then commit the fix on `main` and start from step 3 again.

**No GitHub Release is created until the workflow fully succeeds**, so a failed run leaves nothing half-published.

### Changelog heading doesn't match the tag

The workflow fails at the notes step. Ensure the `CHANGELOG.md` heading exactly matches the tag: if you created `v0.25.0`, the heading must be `## [0.25.0] - YYYY-MM-DD`.

## Rules

- **Tags are immutable.** Never move or reuse a tag — anyone who has fetched it keeps the old target.
- **The one exception** is a tag pushed seconds ago that nobody could have fetched — use the delete commands above.
- **Only tag `main`.** A tag on a feature branch pins an unreviewed commit and would build a release from it.
- **If a shipped version needs a fix** while `main` has moved on, branch from the tag rather than reverting `main`:
  ```bash
  git switch -c release/0.18.x v0.18.0
  # cherry-pick the fix, bump, tag v0.18.1
  ```

## Reference

- Tag is the source of truth — pushing to `main` alone ships nothing
- Workflow: `.github/workflows/release.yml`
- Version/changelog history: `CHANGELOG.md`
