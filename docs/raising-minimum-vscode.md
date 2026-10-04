# Raising the minimum VS Code version

Status: planning stage

## Why it is not a dependency bump

The minimum version and the types package are coupled. `vsce` refuses to package when `@types/vscode` is newer than `engines.vscode`, so bumping one means raising the other together, which drops all users on older VS Code instantly. Keeping the types pinned at the minimum also prevents the codebase from accidentally using newer APIs.

The test suite offers no protection: `pnpm test:extension` downloads the latest stable VS Code regardless of the minimum version in the manifest, so the floor is untested.

## Mechanics

- Bump `engines.vscode` and `@types/vscode` to the same new version
- Update the minimum version stated in the README
- Run `tsc` to surface any removed or changed APIs
- Run `pnpm test:extension` to verify the extension suite still passes
- Add the new minimum to the changelog

## To assess

- Which APIs added since the current minimum would genuinely benefit the extension, and whether those benefits justify dropping older users
- What share of the extension's user base runs a VS Code version below the candidate minimum
- Whether to pin an extension-test run to the minimum version so the floor is actually tested, rather than always testing against the latest stable release
