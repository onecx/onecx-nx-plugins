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
        .read('src/app/onecx-example.remote.module.ts')!
        .toString();
      expect(remoteModule).not.toContain('declarations:');
      expect(remoteModule).toContain('AppEntrypointComponent,');
      expect(remoteModule).toContain(
        "createAppEntrypoint(AppEntrypointComponent, 'ocx-example-component'"
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
