import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import { applicationGenerator, E2eTestRunner } from '@nx/angular/generators';
import { execSync } from 'child_process';
import * as ora from 'ora';

import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import {
  configurePreCommit,
  configureQualityChecks,
  safeReplace,
} from '@onecx/generator-utils';
import { GeneratorProcessor } from '../shared/generator.utils';
import { AngularGeneratorSchema } from './schema';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';

// set default options for the generator
const PARAMETERS: GeneratorParameter<AngularGeneratorSchema>[] = [
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
  {
    key: 'chatty',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function angularGenerator(
  tree: Tree,
  options: AngularGeneratorSchema
): Promise<GeneratorCallback> {
  function log(command: unknown) {
    if (options.chatty) {
      console.log('');
      console.log('generate angular ==> ' + command);
    }
  }
  const parameters = await processParams<AngularGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora('Adding Angular').start();
  const directory = '.';

  const applicationGeneratorCallback = await applicationGenerator(tree, {
    name: options.name,
    directory: directory,
    style: 'scss',
    tags: ``,
    routing: false,
    projectNameAndRootFormat: 'as-provided',
    e2eTestRunner: E2eTestRunner.None,
  });

  tree.delete(`${directory}/src/app/nx-welcome.component.ts`);
  tree.delete(`${directory}/src/app/app.config.ts`);
  tree.delete(`${directory}/src/assets/.gitkeep`);

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    `${directory}/`,
    {
      ...options,
      className: names(options.name).className,
      remoteModuleName: names(options.name).className,
      remoteModuleFileName: names(options.name).fileName,
      fileName: names(options.name).fileName,
      constantName: names(options.name).constantName,
      propertyName: names(options.name).propertyName,
      standalone: options.standalone,
    }
  );

  if (!options.standalone) {
    tree.delete(`${directory}/src/app/app.module.ts`);
    tree.delete(`${directory}/src/app/app.component.html`);
    tree.delete(`${directory}/src/app/app.component.scss`);
    tree.delete(`${directory}/src/app/app.component.spec.ts`);
    tree.delete(`${directory}/src/app/app.component.ts`);
  }

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  addBaseToPackageJson(tree, options);
  addScriptsToPackageJson(tree, options);
  addExtensionsToPackageJson(tree);
  configureQualityChecks(tree, 'angular');
  configurePreCommit(
    tree,
    joinPathFragments(__dirname, '../pre-commit-validation/files-upstream')
  );

  const oneCXLibVersion = '^8.7.0';
  const angularVersion = '^21.2.9';

  addDependenciesToPackageJson(
    tree,
    {
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/angular-accelerator': oneCXLibVersion,
      '@onecx/angular-auth': oneCXLibVersion,
      '@onecx/angular-remote-components': oneCXLibVersion,
      '@onecx/angular-webcomponents': oneCXLibVersion,
      '@onecx/angular-utils': oneCXLibVersion,
      ...(options.standalone
        ? { '@onecx/angular-standalone-shell': oneCXLibVersion }
        : {}),
      '@onecx/integration-interface': oneCXLibVersion,
      '@onecx/angular-integration-interface': oneCXLibVersion,
      '@onecx/ngrx-accelerator': oneCXLibVersion,
      '@onecx/ngrx-integration-interface': oneCXLibVersion,
      '@ngx-translate/core': '^17.0.0',
      '@ngx-translate/http-loader': '^17.0.0',
      '@module-federation/enhanced': '^2.4.0',
      '@ngneat/until-destroy': '^10.0.0',
      'ngrx-store-localstorage': '^20.1.0',
      '@ngrx/component': '^21.1.0',
      '@ngrx/effects': '^21.1.0',
      '@ngrx/operators': '^21.1.0',
      '@ngrx/router-store': '^21.1.0',
      '@ngrx/store': '^21.1.0',
      '@ngrx/store-devtools': '^21.1.0',
      '@webcomponents/webcomponentsjs': '^2.8.0',
      '@ngneat/until-destroy': '^10.0.0',
      '@phenomnomnominal/tsquery': '^6.1.4',
      '@protobi/exceljs': '^4.4.0-protobi.9',
      'chart.js': '^4.4.3',
      'd3-scale-chromatic': '^3.1.0',
      ngxtension: '^7.1.0',
      'zone.js': '~0.16.1',
      'ts-semaphore': '^1.0.0',
      '@angular/animations': angularVersion,
      '@angular/cdk': angularVersion,
      '@angular/common': angularVersion,
      '@angular/compiler': angularVersion,
      '@angular/core': angularVersion,
      '@angular/elements': angularVersion,
      '@angular/forms': angularVersion,
      '@angular/platform-browser': angularVersion,
      '@angular/platform-browser-dynamic': angularVersion,
      '@angular/router': angularVersion,
      primeflex: '^3.3.1',
      primeicons: '^7.0.0',
      primeng: '^21.0.0',
      '@primeng/themes': '^21.0.0',
      '@protobi/exceljs': '^4.4.0-protobi.9',
      'chart.js': '^4.4.3',
      'd3-scale-chromatic': '^3.1.0',
      ngxtension: '^7.1.0',
      'ts-semaphore': '^1.0.0',
    },
    {
      '@onecx/build-utils': oneCXLibVersion,
      '@onecx/angular-testing': oneCXLibVersion,
      '@nx/angular': '22.7.1',
      '@nx/devkit': '22.7.1',
      '@nx/jest': '22.7.1',
      '@nx/js': '22.7.1',
      '@nx/web': '22.7.1',
      '@nx/workspace': '22.7.1',
      '@nx/plugin': '22.7.1',
      '@nx/module-federation': '22.7.1',
      '@nx/rspack': '22.7.1',
      '@nx/angular-rspack': '22.7.1',
      '@rspack/core': '1.6.8',
      '@openapitools/openapi-generator-cli': '^2.16.3',
      '@onecx/angular-testing': oneCXLibVersion,
      'ngx-translate-testing': '^7.0.0',
      '@schematics/angular': `~${angularVersion.substring(1)}`,
      '@swc-node/register': '~1.11.1',
      '@swc/core': '~1.15.8',
      '@angular/build': angularVersion,
      // Peer of the @angular/build:extract-i18n executor used by the extract-i18n target;
      // the builder exits early without it. Pinned to the Angular version like the other
      // @angular/* packages.
      '@angular/localize': angularVersion,
      '@angular-devkit/core': angularVersion,
      '@angular-devkit/schematics': angularVersion,
      '@angular-devkit/build-angular': angularVersion.substring(1),
      '@angular/cli': angularVersion,
      '@angular/compiler-cli': angularVersion,
      '@angular/language-service': angularVersion,
      'angular-eslint': '^21.3.1',
      '@angular-eslint/builder': '^21.3.1',
      '@angular-eslint/eslint-plugin': '^21.3.1',
      '@angular-eslint/eslint-plugin-template': '^21.3.1',
      '@angular-eslint/schematics': '^21.3.1',
      '@angular-eslint/template-parser': '^21.3.1',
      '@eslint/js': '^9.8.0',
      '@nx/eslint': '22.7.1',
      '@nx/eslint-plugin': '22.7.1',
      eslint: '^9.28.0',
      'eslint-config-prettier': '^10.0.0',
      'eslint-plugin-import': '2.31.0',
      'eslint-plugin-prettier': '^5.2.1',
      jest: '^30.0.0',
      'jest-environment-jsdom': '^30.0.0',
      'jest-preset-angular': '^16.1.4',
      'jest-sonar': '^0.2.16',
      'jest-sonar-reporter': '^2.0.0',
      nx: '22.7.1',
      prettier: '^3.5.3',
      'sonar-scanner': '^3.1.0',
      typescript: '^5.9.0',
      'typescript-eslint': '^8.33.1',
      '@typescript-eslint/utils': '^8.33.1',
      webpack: '5.105.2',
    }
  );

  adaptTsConfig(tree, options);
  adaptProjectConfiguration(tree, options);
  adaptJestConfig(tree);
  adaptAngularPrefixConfig(tree);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    await applicationGeneratorCallback();
    let cmd = 'rm -rf .vscode ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    // Replace the generated solution for gitignore and jest testing,
    // because they do not fit the needs of the generated application and
    // would require manual adjustments after generation otherwise.
    cmd = 'mv -f .gitignore.org .gitignore';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'rm -f jest.config.ts jest.config.d.ts jest.config.js.map';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'mv -f jest.config.ts.org jest.config.ts';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    cmd = 'npm run format';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
  };
}

function addBaseToPackageJson(tree: Tree, options: AngularGeneratorSchema) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.name = 'onecx-' + names(options.name).fileName + '-ui';
    pkgJson.private = true;
    pkgJson.license = 'Apache-2.0';
    return pkgJson;
  });
}

function addExtensionsToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.jestSonar = {
      reportPath: 'reports',
    };
    return pkgJson;
  });
}

function addScriptsToPackageJson(tree: Tree, options: AngularGeneratorSchema) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.scripts = pkgJson.scripts ?? {};
    pkgJson.scripts[
      'apigen'
    ] = `openapi-generator-cli generate -i src/assets/api/openapi-bff.yaml -c apigen.yaml -o src/app/shared/generated -g typescript-angular --type-mappings AnyType=object`;
    pkgJson.scripts['start'] = 'nx serve --host 0.0.0.0';
    pkgJson.scripts['build'] = 'nx build';
    pkgJson.scripts[
      'postbuild'
    ] = `mv "$(find dist/${options['name']} -maxdepth 1 -type f -name 'styles.*.css' | head -n 1)" dist/${options['name']}/styles.css`;
    pkgJson.scripts['clean'] =
      'npm cache clean --force && npx clear-npx-cache && rm -rf *.log dist reports .nx .angular .eslintcache ./node_modules/.cache/prettier/.prettier-cache';
    pkgJson.scripts['format'] = 'prettier --write .';
    pkgJson.scripts['lint'] = 'nx lint';
    pkgJson.scripts['lint:fix'] = 'nx lint --fix';
    pkgJson.scripts['sonar:scan'] = 'sonar-scanner';
    pkgJson.scripts['test'] = 'nx test';
    pkgJson.scripts['test:ci'] = 'nx test --watch=false --coverage';
    return pkgJson;
  });
}

function adaptTsConfig(tree: Tree, options: AngularGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const filePath = 'tsconfig.app.json';
  const find = ['"files": [', '"compilerOptions": {'];
  const replaceWith = [
    `"files": [
    "src/app/onecx-${fileName}.remote.module.ts",
    "src/polyfills.ts",
  `,
    `"compilerOptions": {
    "useDefineForClassFields": false,
  `,
  ];

  safeReplace(
    'Adapt files and compilerOptions Typescript config',
    filePath,
    find,
    replaceWith,
    tree
  );

  safeReplace(
    'Set moduleResolution to bundler in base tsconfig',
    'tsconfig.json',
    ['"moduleResolution": "node"'],
    ['"moduleResolution": "bundler"'],
    tree
  );
}

function adaptProjectConfiguration(
  tree: Tree,
  options: AngularGeneratorSchema
) {
  const config = readProjectConfiguration(tree, options.name);
  const fileName = names(options.name).fileName;
  const outputPath = `./dist/${fileName}`;

  // Build & serve are backed by the Rspack executors. They run with
  // `standardRspackConfigFunction: false` (the default), so Nx invokes the async
  // `rspack.config.js` and uses its return value as the complete Rspack configuration. All
  // Angular build inputs are therefore baked in inside `rspack.config.js` (via `createConfig`
  // from `@nx/angular-rspack`, which installs the NgRspackPlugin), and the project.json
  // options below only carry what the executors read directly (rspackConfig, tsConfig for
  // type-checking, outputPath for the outfile and outputs, and index for the dev-server
  // history fallback).
  config.targets['build'].executor = '@nx/rspack:rspack';
  config.targets['build'].options = {
    outputPath,
    index: 'src/index.html',
    tsConfig: 'tsconfig.app.json',
    rspackConfig: 'rspack.config.js',
  };
  // With `standardRspackConfigFunction: false` the generated rspack.config.js discards the
  // Nx-composed config and returns the `createConfig(...)` merge, so executor-level options
  // like budgets/fileReplacements never take effect — the effective values live in
  // rspack.config.js behind the `isProduction` split. Only `mode` is set here: the executor
  // maps it to NODE_ENV, which drives that split.
  config.targets['build'].configurations = {
    ...(config.targets['build'].configurations ?? {}),
    development: {
      ...(config.targets['build'].configurations.development ?? {}),
      mode: 'development',
    },
    production: {
      ...(config.targets['build'].configurations.production ?? {}),
      mode: 'production',
    },
  };

  config.targets['serve'].executor = '@nx/rspack:dev-server';
  config.targets['serve'].options = {
    ...(config.targets['serve'].options ?? {}),
    buildTarget: `${fileName}:build`,
    host: '0.0.0.0',
    publicHost: 'http://localhost:4200',
    proxyConfig: 'proxy.conf.js',
  };

  config.targets['extract-i18n'].executor = '@angular/build:extract-i18n';
  updateProjectConfiguration(tree, fileName, config);
}

function adaptJestConfig(tree: Tree) {
  const filePath = 'jest.config.ts';
  safeReplace(
    'Adapt transformIgnorePatterns in Jest Config',
    filePath,
    /transformIgnorePatterns: .+?,/,
    `transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*\\.mjs$))'],
    moduleNameMapper: {
    '^@primeng/themes': '<rootDir>/node_modules/@primeng/themes/index.mjs',
  },`,
    tree
  );
}

function adaptAngularPrefixConfig(tree: Tree) {
  if (tree.exists('.eslintrc.json')) {
    updateJson(tree, '.eslintrc.json', (json) => {
      const override = json['overrides'].find(
        (o) => !!o.rules['@angular-eslint/directive-selector']
      );
      override.rules['@angular-eslint/directive-selector'][1].prefix = 'app';
      override.rules['@angular-eslint/component-selector'][1].prefix = 'app';
      return json;
    });
  }
  updateJson(tree, 'project.json', (json) => {
    json.prefix = 'app';
    json.targets.test.options.coverage = true;
    return json;
  });
}

export default angularGenerator;
