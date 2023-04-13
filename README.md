# [Advent of Code 2022](https://adventofcode.com/2022)

[![CodeQL](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql.yml/badge.svg)](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/codeql.yml)
[![unit-test](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/ci.yml/badge.svg)](https://github.com/iNViTiON/Advent-of-Code-2022/actions/workflows/ci.yml)

## What is it?

<https://adventofcode.com/2022> in [`TypeScript`](https://www.typescriptlang.org/) with [`RxJS`](https://rxjs.dev/)

## How to execute

<del>Recommend to run using [`NodeJS`](https://nodejs.org/en/) 18+ with [`corepack`](https://nodejs.org/api/corepack.html).</del>  
Recommend to run using [`Volta`](https://volta.sh/).
Just run with `dev` script for develop. The script will watch, re-build, and re-run everytime the file change.

```sh
# corepack enable # moving to Volta
yarn install
yarn dev {dayNum} {part} {input: 'ex' | 'in'}
```

### e.g. dev with day 1 part 1 sample

```sh
yarn dev 1 1 ex
```

## How to run test
### Running specific test

```sh
yarn test {dayNum} {part|testname}
```

### Running all test

```sh
yarn  test-all
```

## Note

### [Yarn](https://yarnpkg.com/)
- Fix Yarn version inside `package.json`.
  - <del>But not store Yarn release inside repository.</del>
  - <del>Recommended to enable NodeJS [`corepack`](https://nodejs.org/api/corepack.html).</del>
  - Moving to [Volta](https://volta.sh/) instead of `corepack` to fix both Yarn and Node.js.
- Using [`Yarn PnP`](https://yarnpkg.com/features/pnp) but not [`Zero-Installs`](https://yarnpkg.com/features/zero-installs) like [Advent-of-Code 2021](https://github.com/iNViTiON/Advent-of-Code-2021) since we need native binary from `SWC` and `esbuild`
- `Yarn PnP` install still fast. But I add `post-install` script to update [`sdks`](https://yarnpkg.com/getting-started/editor-sdks) and now it a bit slow.

### [Volta](https://volta.sh/)
- Using Volta at work, so I decide to use it here too.

### [TypeScript](https://www.typescriptlang.org/) (TS)
- Not using TS to compile or run anythings here. Just keeping the package to maintain VS Code integration with `Yarn PnP` via [`Yarn SDKS`](https://yarnpkg.com/getting-started/editor-sdks).

### [SWC](https://swc.rs/)
- First time try using SWC `swc` to build instead of TypeScript `tsc`.

### [esbuild](https://esbuild.github.io/)
- First time try using `esbuild` to build instead of TypeScript `tsc`.
- First time bundle output using `esbuild`.
- First time minify output using `esbuild`.

### [tsx](https://github.com/esbuild-kit/tsx)
- First time try using `tsx` to run, both for app and test.

### [Node.js Test runner](https://nodejs.org/api/test.html)
- First time try using `Node.js` native test runner.

### [concurrently](https://www.npmjs.com/package/concurrently)
- This year I decide to goes with many new tools, e.g. `SWC` or native `NodeJS` watch or native ESM, I just can't figure out how to combine all those tool into one command that still work with `Yarn PnP`. So I just separate `build` and `serve` commands then combine it with `concurrently`.
- After day 3, try moving from `SWC` to `esbuild` with added of bundling. `SWC` script command still available by append `-swc`.
- `dev` script build before invoke `concurrently`, to prevent `dev` fail to `serve` since the app never build and the file didn't exist.

### No [Nodemon](https://nodemon.io/) ?
- While I using `Nodemon` in [Advent of Code 2021](https://github.com/iNViTiON/Advent-of-Code-2021). `NodeJS` [added native watch support](https://github.com/nodejs/node/pull/44366).
