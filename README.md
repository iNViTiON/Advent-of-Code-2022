# [Advent of Code 2022](https://adventofcode.com/2022)

[![CodeQL](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql.yml/badge.svg)](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql.yml)

## What is it?

<https://adventofcode.com/2022> in [`TypeScript`](https://www.typescriptlang.org/) with [`RxJS`](https://rxjs.dev/)

## How to execute

Recommend to run using [`NodeJS`](https://nodejs.org/en/) 18+ with [`corepack`](https://nodejs.org/api/corepack.html).
Just run with `dev` script for develop. The script will watch, re-build, and re-run everytime the file change.

```sh
corepack enable
yarn install
yarn dev {dayNum} {part} {input: 'ex' | 'in'}
```

### e.g. dev with day 1 part 1 sample

```sh
yarn dev 1 1 ex
```

## Note

### [Yarn](https://yarnpkg.com/)
- Fix Yarn version inside `package.json`.
  - But not store Yarn release inside repository.
  - Recommended to enable NodeJS [`corepack`](https://nodejs.org/api/corepack.html).
- Using [`Yarn PnP`](https://yarnpkg.com/features/pnp) but not [`Zero-Installs`](https://yarnpkg.com/features/zero-installs) like [Advent-of-Code 2021](https://github.com/iNViTiON/Advent-of-Code-2021) since we need native binary from `SWC` and `esbuild`
- `Yarn PnP` install still fast. But I add `post-install` script to update [`sdks`](https://yarnpkg.com/getting-started/editor-sdks) and now it a bit slow.

### [TypeScript](https://www.typescriptlang.org/) (TS)
- Not using TS to compile or run anythings here. Just keeping the package to maintain VS Code integration with `Yarn PnP` via [`Yarn SDKS`](https://yarnpkg.com/getting-started/editor-sdks).

### [SWC](https://swc.rs/)
- First time try using SWC `swc` to build instead of TypeScript `tsc`.

### [esbuild](https://esbuild.github.io/)
- First time try using `esbuild` to build instead of TypeScript `tsc`.
- First time bundle output using `esbuild`.
- First time minify output using `esbuild`.

### [concurrently](https://www.npmjs.com/package/concurrently)
- This year I decide to goes with many new tools, e.g. `SWC` or native `NodeJS` watch or native ESM, I just can't figure out how to combine all those tool into one command that still work with `Yarn PnP`. So I just separate `build` and `serve` commands then combine it with `concurrently`.
- After day 3, try moving from `SWC` to `esbuild` with added of bundling. `SWC` script command still available by append `-swc`.
- `dev` script build before invoke `concurrently`, to prevent `dev` fail to `serve` since the app never build and the file didn't exist.

### No [Nodemon](https://nodemon.io/) ?
- While I using `Nodemon` in [Advent of Code 2021](https://github.com/iNViTiON/Advent-of-Code-2021). `NodeJS` [added native watch support](https://github.com/nodejs/node/pull/44366).
