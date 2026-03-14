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
import { safeReplace } from '../shared/safeReplace';
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
  }
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
  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  addBaseToPackageJson(tree, options);
  addScriptsToPackageJson(tree, options);
  addExtensionsToPackageJson(tree);

  const oneCXLibVersion = '^5.47.5';
  addDependenciesToPackageJson(
    tree,
    {
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/angular-accelerator': oneCXLibVersion,
      '@onecx/angular-auth': oneCXLibVersion,
      '@onecx/angular-remote-components': oneCXLibVersion,
      '@onecx/angular-webcomponents': oneCXLibVersion,
      '@onecx/integration-interface': oneCXLibVersion,
      '@onecx/angular-integration-interface': oneCXLibVersion,
      '@onecx/ngrx-accelerator': oneCXLibVersion,
      '@onecx/keycloak-auth': oneCXLibVersion,
      '@onecx/portal-integration-angular': oneCXLibVersion,
      '@onecx/portal-layout-styles': oneCXLibVersion,
      '@onecx/angular-utils': oneCXLibVersion,
      '@ngx-translate/core': '^15.0.0',
      '@ngx-translate/http-loader': '^8.0.0',
      '@angular-architects/module-federation': '^18.0.4',
      '@angular/animations': '^18.1.4',
      '@angular/cdk': '^18.1.4',
      '@angular/common': '^18.1.4',
      '@angular/compiler': '^18.1.4',
      '@angular/core': '^18.1.4',
      '@angular/elements': '^18.1.4',
      '@angular/forms': '^18.1.4',
      '@angular/platform-browser': '^18.1.4',
      '@angular/platform-browser-dynamic': '^18.1.4',
      '@angular/router': '^18.1.4',
      '@ngrx/component': '^18.0.2',
      '@ngrx/effects': '^18.0.2',
      '@ngrx/router-store': '^18.0.2',
      '@ngrx/store': '^18.0.2',
      '@ngrx/store-devtools': '^18.0.2',
      '@nx/angular': '^19.8.14',
      '@nx/devkit': '^19.8.14',
      '@nx/plugin': '^19.8.14',
      '@webcomponents/webcomponentsjs': '^2.8.0',
      'keycloak-angular': '^16.1.0',
      'ngrx-store-localstorage': '^18.0.0',
      primeflex: '^3.3.1',
      primeicons: '^7.0.0',
      primeng: '^17.18.8',
    },
    {
      '@openapitools/openapi-generator-cli': '^2.5.2',
      'ngx-translate-testing': '^7.0.0',
      '@angular-devkit/build-angular': '^18.1.4',
      '@angular-devkit/core': '^18.1.4',
      '@angular-devkit/schematics': '^18.1.4',
      'angular-eslint': '^18.4.3',
      '@angular-eslint/builder': '^18.4.3',
      '@angular-eslint/eslint-plugin': '^18.4.3',
      '@angular-eslint/eslint-plugin-template': '^18.4.3',
      '@angular-eslint/schematics': '^18.4.3',
      '@angular-eslint/template-parser': '^18.4.3',
      '@angular/cli': '~18.1.4',
      '@angular/compiler-cli': '^18.1.4',
      '@angular/language-service': '^18.1.4',
      '@eslint/js': '^8.57.1',
      '@nx/eslint': '19.8.14',
      '@nx/eslint-plugin': '19.8.14',
      eslint: '^8.57.1',
      'eslint-config-prettier': '^9.1.0',
      'eslint-plugin-import': '2.31.0',
      'eslint-plugin-prettier': '^5.2.1',
      jest: '^29.7.0',
      'jest-environment-jsdom': '^29.7.0',
      'jest-preset-angular': '~14.2.2',
      'jest-sonar': '^0.2.16',
      'jest-sonar-reporter': '^2.0.0',
      nx: '19.8.14',
      prettier: '^3.5.3',
      'sonar-scanner': '^3.1.0',
      typescript: '~5.5.4',
      webpack: '5.95.0',
    }
  );

  addOverridesToPackageJson(tree);
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

    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts'))
      .join(' ');    
    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
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

function addOverridesToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.overrides = {
      'jest-environment-jsdom': {
        jsdom: '26.0.0',
        'rrweb-cssom': '0.8.0',
      },
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
    pkgJson.scripts['start'] = 'nx serve';
    pkgJson.scripts['build'] = 'nx build';
    pkgJson.scripts[
      'postbuild'
    ] = `mv "$(find dist/${options['name']} -maxdepth 1 -type f -name 'styles.*.css' | head -n 1)" dist/${options['name']}/styles.css`;
    pkgJson.scripts['clean'] =
      'npm cache clean --force && npx clear-npx-cache && rm -rf *.log dist reports .nx .angular .eslintcache ./node_modules/.cache/prettier/.prettier-cache';
    pkgJson.scripts['format'] = 'nx format:write --uncommitted';
    pkgJson.scripts['lint'] = 'nx lint';
    pkgJson.scripts['lint:fix'] = 'nx lint --fix';
    pkgJson.scripts['sonar'] = 'npx sonar-scanner';
    pkgJson.scripts['test'] = 'nx test';
    pkgJson.scripts['test:ci'] =
      'nx test --watch=false --browsers=ChromeHeadless --code-coverage';
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
}

function adaptProjectConfiguration(
  tree: Tree,
  options: AngularGeneratorSchema
) {
  const config = readProjectConfiguration(tree, options.name);
  config.targets['serve'].executor = '@nx/angular:dev-server';
  config.targets['serve'].options = {
    ...(config.targets['serve'].options ?? {}),
    disableHostCheck: true,
    publicHost: 'http://localhost:4200',
    proxyConfig: 'proxy.conf.js',
  };
  config.targets['build'].executor = '@nx/angular:webpack-browser';
  config.targets['build'].options = {
    ...(config.targets['build'].options ?? {}),
    polyfills: 'src/polyfills.ts',
    assets: [
      ...(config.targets['build'].options.assets ?? []),
      {
        glob: '**/*',
        input: './node_modules/@onecx/portal-integration-angular/assets/',
        output: '/onecx-portal-lib/assets/',
      },
    ],
    styles: [
      ...(config.targets['build'].options.styles ?? []),
      'node_modules/primeicons/primeicons.css',
      'node_modules/primeng/resources/primeng.min.css',
      'node_modules/@onecx/portal-integration-angular/assets/output.css',
    ],
    customWebpackConfig: {
      path: 'webpack.config.js',
    },
  };
  config.targets['build'].configurations = {
    ...(config.targets['build'].configurations ?? {}),
    production: {
      ...(config.targets['build'].configurations.production ?? {}),
      budgets: [
        {
          type: 'initial',
          maximumWarning: '1mb',
          maximumError: '2mb',
        },
        {
          type: 'anyComponentStyle',
          maximumWarning: '8kb',
          maximumError: '10kb',
        },
      ],
      fileReplacements: [
        ...(config.targets['build'].configurations.production
          .fileReplacements ?? []),
        {
          replace: 'src/environments/environment.ts',
          with: 'src/environments/environment.prod.ts',
        },
      ],
      customWebpackConfig: {
        path: 'webpack.prod.config.js',
      },
    },
  };
  updateProjectConfiguration(tree, names(options.name).fileName, config);
}

function adaptJestConfig(tree: Tree) {
  const filePath = 'jest.config.ts';
  safeReplace(
    'Adapt transformIgnorePatterns in Jest Config',
    filePath,
    /transformIgnorePatterns: .+?,/,
    `transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*\\.mjs$))'],`,
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
    json.targets.build.options.main = json.targets.build.options.browser;
    json.targets.build.options.assets = [
      'src/favicon.ico',
      'src/assets',
      ...json.targets.build.options.assets,
    ];
    delete json.targets.build.options.browser;
    json.targets.build.options.scripts = [
      'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js',
    ];
    return json;
  });
}

export default angularGenerator;
