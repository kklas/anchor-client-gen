## How to publish a new release

Latest:

- Change `@project-serum/anchor` and `@project-serum/anchor-cli` versions in `package.json` to official npm packages and match the release version
- Change the `anchor-lang` dependency version in `tests/example-program/programs/example-program/Cargo.toml` to match the release version
- Bump the version outputted by `--version` flag in `src/main.ts`
- Bump the package version in `package.json`
- Run `yarn build` and `yarn test`
- Update CHANGELOG.md with the new version
- Commit the changes to git
- Publish the latest version `npm publish`
- Publish the beta version `npm publish --tag beta`
- Tag the commit on master after merging with `git tag <version>`

Beta:

- Update package.json to a beta version (e.g. `0.24.0-beta.1`)
- Update the version outputted by `--version` flag in `src/main.ts` to match the above
- Run `yarn build` and `yarn test`
- Commit the changes to git
- Publish the beta version `npm publish --tag beta` (optionally do a dry run with `--dry-run`)
- Tag the commit on master after merging with `git tag <version>`
