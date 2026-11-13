/** @jest-environment node */
import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readFileSync } from 'fs';
import { join } from 'path';
import presetGenerator from './generator';
import featureGenerator from '../feature/generator';
import searchGenerator from '../search/generator';
import detailsGenerator from '../details/generator';
import createUpdateGenerator from '../create-update/generator';
import pageGenerator from '../ngrx-page/generator';
import { parse } from 'yaml';

describe('preset quality guardrails', () => {
  const argv = process.argv;
  beforeAll(() => {
    process.argv = [...argv, '--non-interactive'];
  });
  afterAll(() => {
    process.argv = argv;
  });

  it.each(['angular', 'ngrx', 'standalone-ngrx'])(
    'installs the packaged hook and style checks for %s',
    async (flavor) => {
      const tree = createTreeWithEmptyWorkspace();
      await presetGenerator(tree, { name: 'example', flavor });

      expect(tree.exists('.babelrc')).toBe(false);
      expect(tree.exists('.husky/pre-commit')).toBe(true);
      expect(tree.exists('scripts/pre-commit-qa')).toBe(true);
      expect(tree.read('AGENTS.md')!.toString()).toContain(
        '[best-practices.md](./best-practices.md)'
      );
      for (const file of ['best-practices.md', 'best-practices.LICENSE']) {
        expect(tree.read(file)?.toString()).toBe(
          readFileSync(join(__dirname, '../angular/files', file), 'utf8')
        );
      }
      expect(readJson(tree, 'package.json')).toMatchObject({
        scripts: {
          prepare: 'husky',
          lint: 'npm run lint:eslint && npm run lint:styles',
          prettier: 'prettier --check .',
          'test:ci': 'nx test --watch=false --coverage',
          'sonar:scan': 'sonar-scanner',
        },
        devDependencies: {
          husky: '^9.1.7',
          'stylelint-config-standard-scss': '^14.0.0',
        },
      });
      expect(readJson(tree, 'package.json').scripts.sonar).toBeUndefined();
      const entrypoint = tree
        .read('src/app/app-entrypoint.component.ts')!
        .toString();
      expect(entrypoint).not.toContain('standalone: false');
      expect(entrypoint).toContain('imports: [RouterOutlet]');
      expect(entrypoint).toContain(
        'changeDetection: ChangeDetectionStrategy.OnPush'
      );
      const remoteModule = tree
        .read('src/app/example-ui.remote.module.ts')!
        .toString();
      expect(remoteModule).not.toContain('declarations:');
      expect(remoteModule).toContain('AppEntrypointComponent,');
      expect(remoteModule).toContain(
        "createAppEntrypoint(AppEntrypointComponent, 'example-ui-component'"
      );
      if (flavor === 'standalone-ngrx') {
        expect(tree.read('src/app/app.component.ts')!.toString()).not.toContain(
          'standalone: false'
        );
        expect(tree.read('src/app/app.module.ts')!.toString()).not.toContain(
          'bootstrap: [AppComponent]'
        );
        expect(
          tree.read('src/app/app.component.spec.ts')!.toString()
        ).not.toContain('declarations:');
      }
    },
    60000
  );

  describe.each(['angular', 'ngrx', 'standalone-ngrx'])(
    '%s naming',
    (flavor) => {
      it.each([
        [undefined, 'orders-ui', 'ordersUi', 'OrdersUiModule', 'orders-bff'],
        ['', 'orders-ui', 'ordersUi', 'OrdersUiModule', 'orders-bff'],
        [
          'onecx',
          'onecx-orders-ui',
          'onecxOrdersUi',
          'OnecxOrdersUiModule',
          'onecx-orders-bff',
        ],
        [
          'acme',
          'acme-orders-ui',
          'acmeOrdersUi',
          'AcmeOrdersUiModule',
          'acme-orders-bff',
        ],
      ])(
        'wires appPrefix=%s throughout the generated workspace',
        async (appPrefix, appName, remoteName, moduleName, bffName) => {
          const tree = createTreeWithEmptyWorkspace();
          await presetGenerator(tree, {
            name: 'orders',
            flavor,
            ...(appPrefix !== undefined ? { appPrefix } : {}),
          });
          const content = (path: string) => {
            const value = tree.read(path, 'utf8');
            if (value === null)
              throw new Error(`Missing generated file: ${path}`);
            return value;
          };
          const project = readJson(tree, 'project.json');
          const pkg = readJson(tree, 'package.json');
          expect(pkg.name).toBe(appName);
          expect(
            pkg.dependencies['@onecx/angular-webcomponents']
          ).toBeDefined();
          expect(project.name).toBe(appName);
          expect(project.targets.build.options.outputPath).toBe(
            `dist/${appName}`
          );
          expect(
            project.targets.serve.configurations.production.buildTarget
          ).toContain(`${appName}:build`);
          expect(pkg.scripts.build).toContain(`dist/${appName}/styles`);
          expect(pkg.scripts.postbuild).toContain(`dist/${appName}`);
          expect(content('jest.config.ts.org')).toContain(
            `displayName: '${appName}'`
          );
          expect(readJson(tree, 'tsconfig.app.json').files).toContain(
            `src/app/${appName}.remote.module.ts`
          );
          expect(content('src/bootstrap.ts')).toContain(
            `import { ${moduleName} } from './app/${appName}.remote.module'`
          );
          const remote = content(`src/app/${appName}.remote.module.ts`);
          expect(remote).toContain(
            `export class ${moduleName} implements DoBootstrap`
          );
          expect(remote).toContain(`'${appName}-component'`);
          expect(content('module-federation.config.js')).toContain(
            `name: '${remoteName}'`
          );
          expect(content('module-federation.config.js')).toContain(
            `'./${moduleName}': './src/main.ts'`
          );
          expect(content('rspack.config.js')).toContain(
            `uniqueName: '${appName}'`
          );
          const values = parse(content('helm/values.yaml'));
          expect(values.app.name).toBe(appName);
          expect(values.app.image.repository).toBe(`onecx-apps/${appName}`);
          expect(values.app.routing.path).toBe('/mfe/orders/');
          expect(values.app.operator.microfrontend.specs.main).toMatchObject({
            remoteName,
            exposedModule: `./${moduleName}`,
            tagName: `${appName}-component`,
          });
          expect(values.app.operator.microservice.spec.name).toBe(appName);
          expect(parse(content('helm/Chart.yaml')).name).toBe(appName);
          expect(content('Dockerfile')).toContain(
            `COPY dist/${appName}/ $DIR_HTML`
          );
          expect(content('Dockerfile')).toContain(`http://${bffName}:8080/`);
          expect(content('proxy.conf.js')).toContain(`http://${bffName}:8080`);
          expect(content('proxy.conf.js')).toContain("'/mfe/orders'");
          expect(
            parse(content('src/assets/api/openapi-bff.yaml')).servers
          ).toEqual([{ url: `http://${bffName}:8080/` }]);
        },
        60000
      );
    }
  );

  describe('generated page best practices', () => {
    let tree: Tree;

    beforeAll(async () => {
      const originalArgv = process.argv;
      process.argv = [
        ...originalArgv,
        '--resource',
        'Book',
        '--pageName',
        'Overview',
        '--pageTitle',
        'Overview',
      ];
      try {
        tree = createTreeWithEmptyWorkspace();
        await presetGenerator(tree, { name: 'example', flavor: 'ngrx' });
        await featureGenerator(tree, {
          name: 'books',
          resource: 'Book',
          customizeNamingForAPI: false,
          existStrategy: 'skip',
        });
        const options = {
          featureName: 'books',
          resource: 'Book',
          customizeNamingForAPI: false,
          serviceName: 'BookAPIService',
          updateRequestName: 'UpdateBookRequest',
          updateResponseName: 'UpdateBookResponse',
        };
        await searchGenerator(tree, {
          ...options,
          existStrategy: 'skip',
          searchRequestName: 'SearchBooksRequest',
          searchResponseName: 'SearchBooksResponse',
        });
        await detailsGenerator(tree, {
          ...options,
          getResponseName: 'GetBookResponse',
          editMode: true,
          allowDelete: true,
        });
        await createUpdateGenerator(tree, {
          ...options,
          createRequestName: 'CreateBookRequest',
          createResponseName: 'CreateBookResponse',
          createRequestPropertyName: 'createBookRequest',
          createResponsePropertyName: 'createBookResponse',
          updateRequestPropertyName: 'updateBookRequest',
          updateResponsePropertyName: 'updateBookResponse',
        });
        await pageGenerator(tree, {
          featureName: 'books',
          pageName: 'Overview',
          pageTitle: 'Overview',
        });
      } finally {
        process.argv = originalArgv;
      }
    }, 60000);

    it('sets OnPush on every generated page and dialog component', () => {
      for (const component of [
        'book-search/book-search',
        'book-details/book-details',
        'book-search/dialogs/book-create-update/book-create-update',
        'overview/overview',
      ]) {
        const content = tree
          .read(`src/app/books/pages/${component}.component.ts`)!
          .toString();
        expect(content).toContain('ChangeDetectionStrategy');
        expect(content).toContain(
          'changeDetection: ChangeDetectionStrategy.OnPush'
        );
      }
    });

    it('uses inject() in effects while preserving parent route resolution', () => {
      const effects = tree
        .read('src/app/books/pages/overview/overview.effects.ts')!
        .toString();
      expect(effects).not.toContain('constructor(');
      expect(effects).toContain('inject(ActivatedRoute, { skipSelf: true })');
      for (const dependency of [
        'Actions',
        'Router',
        'Store',
        'PortalMessageService',
      ]) {
        expect(effects).toContain(`inject(${dependency})`);
      }
    });
  });
});
