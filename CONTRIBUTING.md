# Contributing

## Release a version:

1. Run checks:
   ```sh
   bun run build
   bun check
   bun test
   bunx jsr publish --dry-run
   ```
1. Update version in `package.json` and `jsr.json`
1. Commit, tag, and push:
   ```sh
   VERSION="X.Y.Z"
   git commit -am "chore(release): v$VERSION"
   git tag v$VERSION
   git push
   git push --tags
   ```
1. Release:
   ```sh
   bunx jsr publish
   bun publish
   ```
