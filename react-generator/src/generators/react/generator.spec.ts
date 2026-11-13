/** @jest-environment node */
import { readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import reactGenerator from './generator';
import presetGenerator from '../preset/generator';
import { parse } from 'yaml';

describe('React quality guardrails', () => {
  const argv = process.argv;
  beforeAll(() => {
    process.argv = [...argv, '--non-interactive'];
  });
  afterAll(() => {
    process.argv = argv;
  });

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
    'wires appPrefix=%s throughout the React preset',
    async (appPrefix, appName, remoteName, moduleName, bffName) => {
      const tree = createTreeWithEmptyWorkspace();
      await presetGenerator(tree, {
        name: 'orders',
        flavor: 'react',
        ...(appPrefix !== undefined ? { appPrefix } : {}),
      });
      const content = (path: string) => {
        const value = tree.read(path, 'utf8');
        if (value === null) throw new Error(`Missing generated file: ${path}`);
        return value;
      };
      expect(readJson(tree, 'package.json').name).toBe(appName);
      expect(
        readJson(tree, 'package.json').dependencies[
          '@onecx/react-webcomponents'
        ]
      ).toBeDefined();
      const project = readJson(tree, 'project.json');
      expect(project.name).toBe(appName);
      expect(project.targets.build.options.outputPath).toBe(`dist/${appName}`);
      const vite = content('vite.config.ts');
      expect(vite).toContain(`name: '${remoteName}'`);
      expect(vite).toContain(`'./${moduleName}': './src/bootstrap.ts'`);
      expect(vite).toContain(`outDir: 'dist/${appName}'`);
      expect(vite).toContain("'/mfe/onecx-orders/'");
      expect(vite).toContain(`target: 'http://${bffName}:8080'`);
      expect(vite).toContain("'/bff':");
      const values = parse(content('helm/values.yaml'));
      expect(values.productName).toBe('onecx-orders');
      expect(values.app.routing.path).toBe('/mfe/onecx-orders/');
      expect(content('src/App.tsx')).toContain("PRODUCT_NAME: 'onecx-orders'");
      expect(values.app.name).toBe(appName);
      expect(values.app.image.repository).toBe(`onecx-apps/${appName}`);
      expect(values.app.operator.microfrontend.specs.main).toMatchObject({
        remoteName,
        exposedModule: `./${moduleName}`,
        tagName: `${appName}-component`,
      });
      expect(values.app.operator.microservice.spec.name).toBe(appName);
      expect(parse(content('helm/Chart.yaml')).name).toBe(appName);
      expect(content('src/bootstrap.ts')).toContain(`'${appName}-component'`);
      expect(content('src/bootstrap.test.ts')).toContain(
        `'${appName}-component'`
      );
      expect(content('Dockerfile')).toContain(
        `COPY dist/${appName}/ $DIR_HTML`
      );
      expect(content('Dockerfile')).toContain(`http://${bffName}:8080/`);
      expect(parse(content('src/assets/api/openapi-bff.yaml')).servers).toEqual(
        [{ url: `http://${bffName}:8080/` }]
      );
    },
    60000
  );

  it.each(['primeflex', 'tailwind'] as const)(
    'installs quality checks for %s styling',
    async (styles) => {
      const tree = createTreeWithEmptyWorkspace();
      await reactGenerator(tree, { name: 'example', styles, aiTool: 'none' });

      expect(tree.exists('.husky/pre-commit')).toBe(true);
      expect(tree.exists('scripts/pre-commit-qa')).toBe(true);
      expect(readJson(tree, 'package.json')).toMatchObject({
        scripts: {
          prepare: 'husky',
          lint: 'npm run lint:eslint && npm run lint:styles',
          prettier: 'prettier --check .',
          'sonar:scan': 'sonar-scanner',
        },
        devDependencies: {
          husky: '^9.1.7',
          'stylelint-config-standard': '^38.0.0',
        },
      });
      expect(readJson(tree, 'package.json').scripts.sonar).toBeUndefined();
      expect(
        readJson(tree, '.stylelintrc.json').rules['at-rule-no-unknown'][1]
          .ignoreAtRules
      ).toContain('theme');
    },
    60000
  );
});
