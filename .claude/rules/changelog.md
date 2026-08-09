---
paths:
  - 'CHANGELOG.md'
---

# Changelog Rules

Entries are for people using the extension, not for whoever wrote the code. Short and plain beats complete.

- Newest version first, under `## [x.y.z] - YYYY-MM-DD`. Unreleased work goes under `## [Unreleased]`
- Start each bullet with a change type in past tense — Added, Changed, Deprecated, Removed, Fixed, Security — then the user-visible effect
- One sentence, one change. No trailing period, active voice, no pronouns. Split any bullet whose "and" joins two unrelated changes
- Add a second sentence only when the user has to act on it (a renamed setting, a migration)
- Leave out the cause, the file names and the implementation. `Fixed the Paragraph and Code block toolbar buttons, which were permanently disabled` — not the story of why they were
- Omit what is invisible from outside: refactors, tests, tooling, dependency bumps. Include them only when behaviour or performance changed
