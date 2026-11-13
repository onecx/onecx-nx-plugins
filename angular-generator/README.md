# onecx-angular-generator

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build angular-generator` to build the library.

## Running unit tests

Run `nx test angular-generator` to execute the unit tests via [Jest](https://jestjs.io).

## Local Rspack smoke test

The local NgRx test workspace is at `~/onecx/test-app/lib-management` and was
generated from this checkout's sources. Its build and serve targets use
`@nx/rspack`, and its `rspack.config.js` is rendered from the
[Rspack configuration template](src/generators/angular/files/rspack.config.js.template).

Global styles import the packaged CSS (for example, `primeflex/primeflex.css`)
without `node_modules/` prefixes, so Rspack resolves and bundles dependency styles
without compiling their Sass sources.

Generated Angular workspaces do not include a custom `.babelrc`; Angular's build
and i18n extraction tools manage their own transforms. For workspaces generated
with the old `latest`, `react`, and `stage-0` presets, remove that legacy `.babelrc`
before running `nx run extract-i18n`.
