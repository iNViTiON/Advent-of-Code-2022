# [Advent of Code 2022](https://adventofcode.com/2022)

[![CodeQL](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql-analysis.yml)

## What is it?

<https://adventofcode.com/2022>

## How to execute

Recommend to run using NodeJS 18+ with `corepack`.
Just run with `dev` script for develop. The script will watch, re-build, and re-run everytime the file change.

```sh
corepack enable
yarn install
yarn dev {dayNum} {part}
```

## Demo

```sh
yarn dev 0 0
```

## Note

### [Yarn](https://yarnpkg.com/)
- Fix Yarn version inside `package.json`.
  - But not store Yarn release inside repository.
  - Recommended to enable NodeJS [`corepack`](https://nodejs.org/api/corepack.html).

### [TypeScript](https://www.typescriptlang.org/) (TS)
- Not using TS to compile or run anythings here. Just keeping the package to maintain VS Code integration with [`Yarn PnP`](https://yarnpkg.com/features/pnp) via [`Yarn SDKS`](https://yarnpkg.com/getting-started/editor-sdks).

### [SWC](https://swc.rs/)
- First time try using SWC `swc` to build instead of TypeScript `tsc`.

### [concurrently](https://www.npmjs.com/package/concurrently)
- This year I decide to goes with many new tools, e.g. `SWC` or native `NodeJS` watch or native ESM, I just can't figure out how to combine all those tool into one command that still work with `Yarn PnP`. So I just separate `build` and `serve` commands then combine it with `concurrently`.
- `dev` script build before invoke `concurrently`, to prevent `dev` fail to `serve` since the app never build and the file didn't exist.

### [Nodemon](https://nodemon.io/) ?
- While I using `Nodemon` in [Advent of Code 2021](https://github.com/iNViTiON/Advent-of-Code-2021). `NodeJS` [added native watch support](https://github.com/nodejs/node/pull/44366).
