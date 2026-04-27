import {
  GeneratorCallback,
  Tree,
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import angularGenerator from '../angular/generator';
import { safeReplace } from '../shared/safeReplace';
import { NgrxGeneratorSchema } from './schema';

// set default options for the generator
const PARAMETERS: GeneratorParameter<NgrxGeneratorSchema>[] = [
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

export async function ngrxGenerator(
  tree: Tree,
  options: NgrxGeneratorSchema
): Promise<GeneratorCallback> {
  function log(command: unknown) {
    if (options.chatty) {
      console.log('');
      console.log('generate ngrx ==> ' + command);
    }
  }
  const parameters = await processParams<NgrxGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);
  const directory = '.';
  let angularGeneratorCallback: GeneratorCallback | undefined = undefined;

  if (!options.skipInitAngular) {
    log('generate Angular app');
    angularGeneratorCallback = await angularGenerator(tree, options);
  }

  const spinner = ora('Adding NgRx').start();
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    `${directory}/`,
    {
      ...options,
      remoteModuleName: names(options.name)['className'],
      lowerCamelCaseName: names(options.name)['propertyName'],
    }
  );

  log('addDependenciesToPackageJson');
  addDependenciesToPackageJson(
    tree,
    {
      '@ngrx/effects': '^15.4.0',
      '@ngrx/router-store': '^15.4.0',
      '@ngrx/store': '^15.4.0',
      '@ngrx/component': '^15.4.0',
      '@ngrx/store-devtools': '^15.3.0',
      zod: '^3.22.1',
    },
    {}
  );

  if (options.standalone) {
    addModulesToAppModule(tree);
  }
  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    if (angularGeneratorCallback) {
      log('angularGeneratorCallback');
      await angularGeneratorCallback();
    }
    // exclude steps made by the Angular generator to avoid redundant formatting and package installations
    if (options.skipInitAngular) {
      let cmd = '';
      const files = tree
        .listChanges()
        .map((c) => c.path)
        .filter((p) => p.endsWith('.ts'))
        .join(' ');
      cmd = 'npx prettier --write ';
      log(cmd);
      execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });

      log('installPackagesTask ');
      installPackagesTask(tree);
    }
  };
}

function addModulesToAppModule(tree: Tree) {
  console.log('addModulesToAppModule ');
  addImportsToAppModule(tree);
  safeReplace(
    `Update AppModule with NgRx setup`,
    'src/app/app.module.ts',
    'AppRoutingModule,',
    `AppRoutingModule,
     LetDirective,
     StoreRouterConnectingModule.forRoot(),
     StoreModule.forRoot(reducers, { metaReducers }),
     StoreDevtoolsModule.instrument({
       maxAge: 25,
       logOnly: !isDevMode(),
       autoPause: true,
       trace: false,
       traceLimit: 75,
     }),
     EffectsModule.forRoot([]),`,
    tree
  );
}

function addImportsToAppModule(tree: Tree) {
  const find = [`from '@angular/common'`, `NgModule`];
  const replaceWith = [
    `from '@angular/common';
    import { StoreModule } from '@ngrx/store';
    import { reducers, metaReducers } from './app.reducers';
    import { StoreDevtoolsModule } from '@ngrx/store-devtools';
    import { LetDirective } from '@ngrx/component';
    import { EffectsModule } from '@ngrx/effects';
    import { StoreRouterConnectingModule } from '@ngrx/router-store';
    `,
    `NgModule, isDevMode`,
  ];
  safeReplace(
    `Add NgRx imports to AppModule`,
    'src/app/app.module.ts',
    find,
    replaceWith,
    tree
  );
}

export default ngrxGenerator;
