# [2.0.0](https://github.com/cezarsmpio/tinytivity/compare/v1.2.0...v2.0.0) (2026-11-12)


* feat!: port tinytivity from Deno to npm (Node.js 18+) ([#7](https://github.com/cezarsmpio/tinytivity/issues/7)) ([8e8653d](https://github.com/cezarsmpio/tinytivity/commit/8e8653d7bd2ca2177a32976136e19cac365f282d))


### BREAKING CHANGES

* tinytivity is published on npm instead of JSR and requires Node.js 26 or newer. The runtime API is unchanged.

* docs: note the branch protection requirement for releases

* chore: embed sources in the published source map

* docs: refresh the benchmark sample output

* feat: support Node.js 18 and newer

- lower the runtime engine floor from Node 26 to Node 18
- target ES2022 in the published build
- run the test suite as plain JavaScript against the built package
- add a CI matrix that tests the built package on Node 18, 20, 22, 24, and 26
- keep Node 26 for development tooling and the node:bench benchmarks

* fix: keep watch() types compatible with TypeScript 4.9

Remove the const type parameter, which older TypeScript versions cannot parse, and use the original array-based signature so the declarations stay broadly compatible.

* chore(release): publish with npm trusted publishing

- Drop NPM_TOKEN/NODE_AUTH_TOKEN from the release workflow; npm exchanges
  the GitHub OIDC token automatically.
- Remove publishConfig.provenance, which is automatic under trusted
  publishing and breaks local npm publish/stage publish.
- Disable the package manager cache in the release job.

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/cezarsmpio/tinytivity/compare/v1.1.6...v1.2.0) (2026-08-03)


### Features

* improve support for async watcher callbacks ([#6](https://github.com/cezarsmpio/tinytivity/issues/6)) ([03d492a](https://github.com/cezarsmpio/tinytivity/commit/03d492a7b548ce7cc08791e4b8da4b174fc9ae51))

### [1.1.6](https://github.com/cezarsmpio/tinytivity/compare/v1.1.5...v1.1.6) (2026-08-03)

### [1.1.5](https://github.com/cezarsmpio/tinytivity/compare/v1.1.4...v1.1.5) (2026-08-03)

### [1.1.4](https://github.com/cezarsmpio/tinytivity/compare/v1.1.3...v1.1.4) (2026-08-03)

### [1.1.3](https://github.com/cezarsmpio/tinytivity/compare/v1.1.2...v1.1.3) (2026-08-03)

### [1.1.2](https://github.com/cezarsmpio/tinytivity/compare/v1.1.1...v1.1.2) (2026-08-03)

### [1.1.1](https://github.com/cezarsmpio/tinytivity/compare/v1.1.0...v1.1.1) (2026-08-03)

## 1.1.0 (2026-08-03)


### Features

* export watch method ([b6e1b77](https://github.com/cezarsmpio/tinytivity/commit/b6e1b776b445db229614df3df08eada1c22af953))


## 1.0.0 (2026-08-03)


### Features

* initial release ([e6bc512](https://github.com/cezarsmpio/tinytivity/commit/e6bc512a65f0e33e7a6040da6d77bb05250910fa))
