---
paths:
  - 'package.json'
---

# Dependency Version Rules

- Pin exact versions, no `^`/`~`. `save-exact=true` in `.npmrc` only applies when `pnpm add <pkg>` has no version or an exact one — `pnpm add <pkg>@5` saves `^5.x.x` anyway. If a range slips in, re-run with the exact resolved version.
