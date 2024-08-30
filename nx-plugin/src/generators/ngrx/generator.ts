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
import angularGenerator from '../angular/generator';
import { NgrxGeneratorSchema } from './schema';

export async function ngrxGenerator(
  tree: Tree,
  options: NgrxGeneratorSchema
): Promise<GeneratorCallback> {
  const directory = '.';
  let angularGeneratorCallback;
  if (!options.skipInitAngular) {
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

  addModulesToAppModule(tree);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    if (angularGeneratorCallback) {
      await angularGeneratorCallback();
    }

    installPackagesTask(tree, true);

    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts'))
      .join(' ');
    execSync('npx organize-imports-cli ' + files, {
      cwd: tree.root,
      stdio: 'inherit',
    });
    execSync('npx prettier --write ' + files, {
      cwd: tree.root,
      stdio: 'inherit',
    });

    installPackagesTask(tree, true);
  };
}

function addModulesToAppModule(tree: Tree) {
  addImportsToAppModule(tree);

  replaceInFile(
    tree,
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
     EffectsModule.forRoot([]),`
  );
}

function addImportsToAppModule(tree: Tree) {
  replaceInFile(
    tree,
    'src/app/app.module.ts',
    `from '@angular/common';`,
    `from '@angular/common';
    import { StoreModule } from '@ngrx/store';
    import { reducers, metaReducers } from './app.reducers';
    import { StoreDevtoolsModule } from '@ngrx/store-devtools';
    import { LetDirective } from '@ngrx/component';
    import { EffectsModule } from '@ngrx/effects';
    import { StoreRouterConnectingModule } from '@ngrx/router-store';
    import { environment } from 'src/environments/environment';
    `
  );
  replaceInFile(
    tree,
    'src/app/app.module.ts',
    `PortalCoreModule,`,
    `PortalCoreModule,
     APP_CONFIG,`
  );
  replaceInFile(
    tree,
    'src/app/app.module.ts',
    `NgModule`,
    `NgModule, isDevMode`
  );
}

function replaceInFile(tree, filePath, oldString, newString) {
  const contents = tree.read(filePath).toString();
  const newContents = contents.replace(oldString, newString);
  tree.write(filePath, newContents);
}

export default ngrxGenerator;
