/** @jest-environment node */

import { readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { presetGenerator } from './generator';
import { runInNewContext } from 'vm';

describe('Rspack preset output', () => {
  const originalDaemon = process.env.NX_DAEMON;
  beforeAll(() => {
    process.env.NX_DAEMON = 'false';
  });
  afterAll(() => {
    if (originalDaemon === undefined) {
      delete process.env.NX_DAEMON;
    } else {
      process.env.NX_DAEMON = originalDaemon;
    }
  });
  it.each(['angular', 'ngrx', 'standalone-ngrx'])(
    'scaffolds %s without requiring consumer migrations',
    async (flavor) => {
      const tree = createTreeWithEmptyWorkspace();
      tree.write('.gitignore', '');
      const callback = await presetGenerator(tree, {
        name: 'rspack-test',
        flavor,
      });
      const project = readProjectConfiguration(tree, 'rspack-test');
      const pkg = readJson(tree, 'package.json');

      expect(typeof callback).toBe('function');
      expect(project.targets.build.executor).toBe('@nx/rspack:rspack');
      expect(project.targets.build.options.rspackConfig).toBe(
        'rspack.config.js'
      );
      expect(project.targets.build.configurations.production.mode).toBe(
        'production'
      );
      expect(project.targets.build.configurations.development.mode).toBe(
        'development'
      );
      expect(project.targets.serve.executor).toBe('@nx/rspack:dev-server');
      expect(project.targets.serve.options.buildTarget).toBe(
        'rspack-test:build'
      );
      expect(project.targets['extract-i18n'].executor).toBe(
        '@angular/build:extract-i18n'
      );
      expect(pkg.devDependencies['@nx/rspack']).toBe(pkg.devDependencies.nx);
      expect(pkg.devDependencies['@nx/angular-rspack']).toBe(
        pkg.devDependencies.nx
      );
      expect(pkg.devDependencies['@rspack/core']).toBeDefined();
      expect(pkg.scripts.build).toBe('nx build');
      expect(pkg.scripts['test:ci']).not.toContain('ChromeHeadless');
      expect(
        pkg.devDependencies['modify-source-webpack-plugin']
      ).toBeUndefined();
      expect(tree.exists('webpack.config.js')).toBe(false);
      expect(tree.exists('webpack.prod.config.js')).toBe(false);
      expect(tree.exists('onecx-patch.loader.js')).toBe(true);

      const rspack = tree.read('rspack.config.js', 'utf8');
      expect(rspack).toContain('@module-federation/enhanced/rspack');
      expect(rspack).toContain("require('./onecx-patch.loader.js')");
      expect(rspack).toContain('rules: [getOneCXRspackPatchLoaderRule()]');
      expect(tree.read('src/polyfills.ts', 'utf8')).toContain(
        'createElementFromPrimeNg'
      );
    }
  );
});

describe('OneCX patch-loader', () => {
  const loader: ((source: string) => string) & {
    getOneCXRspackPatchLoaderRule(): {
      test: RegExp;
      use: { loader: string }[];
    };
  } = require('../angular/files/onecx-patch.loader');

  it('forwards original DOM arguments and neutralizes style registration', () => {
    const createElementFromPrimeNg = jest.fn();
    const patched = loader(
      'document.createElement("button", { is: "onecx-button" }); Theme.setLoadedStyleName("x");'
    );
    runInNewContext(patched, {
      document: { createElementFromPrimeNg },
    });
    expect(createElementFromPrimeNg).toHaveBeenCalledWith('button', {
      is: 'onecx-button',
    });
    expect(patched).not.toContain('Theme.setLoadedStyleName');
    expect(loader('const value = 42;')).toBe('const value = 42;');
  });

  it('resolves a loader rule scoped to PrimeNG modules', () => {
    const rule = loader.getOneCXRspackPatchLoaderRule();
    expect(rule.test.test('/node_modules/primeng/fesm2022/primeng-button.mjs')).toBe(
      true
    );
    expect(rule.test.test('/node_modules/@angular/core/fesm2022/core.mjs')).toBe(
      false
    );
    expect(rule.use[0].loader).toBe(
      require.resolve('../angular/files/onecx-patch.loader')
    );
  });
});
