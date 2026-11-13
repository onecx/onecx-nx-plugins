# onecx-create-workspace

This library was generated with [Nx](https://nx.dev).

## Creating a workspace

```sh
npx @onecx/create-workspace <flavor> <product> [--appPrefix=<prefix>]
```

Flavors: `angular`, `ngrx`, `standalone-ngrx`, `react`. The positional product
still names the workspace directory. Creation is non-interactive.

The optional `appPrefix` defaults to the empty string. Both `--appPrefix=acme`
and `--appPrefix acme` are supported. Pass an explicit empty string with
`--appPrefix=""` or `--appPrefix ""`; empty values are forwarded to the preset.
Use lowercase kebab-case without a trailing separator (for example `acme-corp`).

```sh
npx @onecx/create-workspace ngrx orders                    # orders-ui / orders-bff
npx @onecx/create-workspace ngrx orders --appPrefix=""     # orders-ui / orders-bff
npx @onecx/create-workspace ngrx orders --appPrefix=onecx  # onecx-orders-ui / onecx-orders-bff
npx @onecx/create-workspace react orders --appPrefix=acme  # acme-orders-ui / acme-orders-bff
```

The same option is available directly on the Angular, NgRx, standalone NgRx
and React generators and both presets, for example:

```sh
nx g @onecx/angular-generator:ngrx orders --appPrefix=acme --non-interactive
nx g @onecx/react-generator:react orders --appPrefix="" --non-interactive
```

The prefix is applied once to the normalized product slug; names supplied by
users are never stripped of an existing `onecx-` segment. Package/project/chart
and operator microservice identities use `<prefix-><product>-ui`. Build output
and Docker COPY use `dist/<application-identity>/`; Docker, development proxy
and OpenAPI use the matching `<prefix-><product>-bff:8080` hostname.

Federation remote names use camelCase (for example `acmeOrdersUi`), exposed
modules use PascalCase plus `Module` (`./AcmeOrdersUiModule`), and web-component
tags use `<application-identity>-component`. Angular remote module filenames
use `<application-identity>.remote.module.ts`. Copy the matching identifiers
from generated Helm values when registering the application in OneCX.

Routes and product registration are independent of `appPrefix`: Angular keeps
its product-based `/mfe/<product>/` route (the existing camelCase Helm route
behavior is unchanged), while React retains `onecx-<product>` product registration,
`/onecx-<product>` product base path and `/mfe/onecx-<product>/` asset base.
Framework packages, APIs, sharing scopes and OneCX branding are unchanged.

## Building

Run `nx build create-workspace` to build the library.

## Running unit tests

Run `nx test create-workspace` to execute the unit tests via [Jest](https://jestjs.io).
