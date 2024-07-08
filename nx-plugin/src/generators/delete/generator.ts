import {
  formatFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  Tree,
  updateJson,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as ora from 'ora';
import { deepMerge } from '../shared/deepMerge';

import { OpenAPIUtil } from '../shared/openapi/openapi.utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { renderJsonFile } from '../shared/renderJsonFile';
import { DeleteGeneratorSchema } from './schema';
import path = require('path');

const PARAMETERS: GeneratorParameter<DeleteGeneratorSchema>[] = [
  {
    key: 'customizeNamingForAPI',
    type: 'boolean',
    required: 'interactive',
    default: false,
    prompt: 'Do you want to customize the names for the generated API?',
  },
  {
    key: 'apiServiceName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}BffService`;
    },
    prompt: 'Provide a name for your API service (e.g., BookBffService): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'dataObjectName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your Data Object (e.g., Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function createUpdateGenerator(
  tree: Tree,
  options: DeleteGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<DeleteGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding delete to ${options.featureName}`).start();

  const isNgRx = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('@ngrx/'));
  if (!isNgRx) {
    spinner.fail('Currently only NgRx projects are supported.');
    throw new Error('Currently only NgRx projects are supported.');
  }

  adaptFeatureModule(tree, options);

  addDeleteEventsToSearch(tree, options);

  addTranslations(tree, options);

  addFunctionToOpenApi(tree, options);

  await formatFiles(tree);

  spinner.succeed();

  return () => {
    installPackagesTask(tree);
    execSync('npm run apigen', {
      cwd: tree.root,
      stdio: 'inherit',
    });
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
  };
}

function addDeleteEventsToSearch(tree: Tree, options: DeleteGeneratorSchema) {
  adaptSearchActions(tree, options);
  adaptSearchEffects(tree, options);
  adaptSearchComponent(tree, options);
  adaptSearchHTML(tree, options);
  adaptSearchTests(tree, options);
}

function adaptFeatureModule(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const moduleFilePath = joinPathFragments(
    'src/app',
    fileName,
    fileName + '.module.ts'
  );
  let moduleContent = tree.read(moduleFilePath, 'utf8');

  if (!moduleContent.includes('providePortalDialogService()')) {
    moduleContent = moduleContent.replace(
      'declarations:',
      `
    providers: [providePortalDialogService()],
    declarations:`
    );
    moduleContent = moduleContent.replace(
      `from '@ngrx/effects';`,
      `from '@ngrx/effects';
       import { providePortalDialogService } from '@onecx/portal-integration-angular';`
    );
  }
  tree.write(moduleFilePath, moduleContent);
}

function adaptSearchHTML(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const constantName = names(options.featureName).constantName;
  const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

  let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
  htmlContent = htmlContent.replace(
    '<ocx-interactive-data-view',
    `<ocx-interactive-data-view 
      (deleteItem)="delete($event)"
      ${options.standalone ? '' : `deletePermission="${constantName}#DELETE"`}`
  );
  tree.write(htmlSearchFilePath, htmlContent);
}

function adaptSearchComponent(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    `} from '@onecx/portal-integration-angular';`,
    `RowListGridData
    } from '@onecx/portal-integration-angular';`
  );

  content = content.replace(
    'resetSearch',
    `  
    delete({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.delete${className}ButtonClicked({ id }));
    }

    resetSearch`
  );
  tree.write(filePath, content);
}

function adaptSearchActions(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
  const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    'events: {',
    `events: {      
      'Delete ${actionName} button clicked': props<{
        id: number | string;
      }>(),
      'Delete ${actionName} cancelled': emptyProps(),
      'Delete ${actionName} succeeded': emptyProps(),      
      'Delete ${actionName} failed': props<{
        error: string | null;
      }>(),
    `
  );
  tree.write(filePath, content);
}

function adaptSearchEffects(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const constantName = names(options.featureName).constantName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

  let content = tree.read(filePath, 'utf8');
  content =
    `import { PortalDialogService, DialogState } from '@onecx/portal-integration-angular';` +
    `import { mergeMap } from 'rxjs';` +
    `import {
      ${options.dataObjectName},
    } from 'src/app/shared/generated';` +
    `import { PrimeIcons } from 'primeng/api';` +
    content;

  if (!content.includes('private portalDialogService: PortalDialogService')) {
    content = content.replace(
      'constructor(',
      `constructor(
      private portalDialogService: PortalDialogService,`
    );
  }

  content = content.replace(
    'searchByUrl$',
    `
    refreshSearchAfterDelete$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(
          ${className}SearchActions.delete${className}Succeeded,
        ),
        concatLatestFrom(() => this.store.select(selectSearchCriteria)),
        switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
      );
    });
    
    deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(${className}SearchActions.delete${className}ButtonClicked),
      concatLatestFrom(() =>
        this.store.select(${propertyName}SearchSelectors.selectResults)
      ),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id);
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService.openDialog<unknown>(
          '${constantName}_DELETE.HEADER',
          '${constantName}_DELETE.MESSAGE',
          {
            key: '${constantName}_DELETE.CONFIRM',
            icon: PrimeIcons.CHECK,
          },
          {
            key: '${constantName}_DELETE.CANCEL',
            icon: PrimeIcons.TIMES,
          }
        )
        .pipe(
          map(
            (state): [DialogState<unknown>, ${options.dataObjectName} | undefined] => {
              return [state, itemToDelete];
            }
          )
        );
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(${className}SearchActions.delete${className}Cancelled());
        }
        if (!itemToDelete) {
          throw new Error('Item to delete not found!');
        }
        
        return this.${propertyName}Service
          .delete${options.dataObjectName}(itemToDelete.id)
          .pipe(
            map(() => {
              this.messageService.success({
                summaryKey: '${constantName}_DELETE.SUCCESS',
              });
              return ${className}SearchActions.delete${className}Succeeded();
            })
          );
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: '${constantName}_DELETE.ERROR',
        });
        return of(
          ${className}SearchActions.delete${className}Failed({
            error,
          })
        );
      })
    );
  });

    searchByUrl$`
  );
  tree.write(filePath, content);
}

function adaptSearchTests(tree: Tree, options: DeleteGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

  let htmlContent = tree.read(filePath, 'utf8');

  htmlContent =
    `import { PrimeIcons } from 'primeng/api';` +
    htmlContent.replace(
      "it('should dispatch export csv data on export action click'",
      `
    it('should dispatch delete${className}ButtonClicked action on item delete click', async () => {
      jest.spyOn(store, 'dispatch');
  
      store.overrideSelector(select${className}SearchViewModel, {
        ...base${className}SearchViewModel,
        results: [
          {
            id: '1',
            imagePath: '',
            column_1: 'val_1',
          },
        ],
        columns: [
          {
            columnType: ColumnType.STRING,
            nameKey: 'COLUMN_KEY',
            id: 'column_1',
          },
        ],
      });
      store.refreshState();
  
      const interactiveDataView =
        await ${propertyName}Search.getSearchResults();
      const dataView = await interactiveDataView.getDataView();
      const dataTable = await dataView.getDataTable();
      const rowActionButtons = await dataTable.getActionButtons();
  
      expect(rowActionButtons.length).toBeGreaterThan(0);
      let deleteButton;
      for (const actionButton of rowActionButtons) {
        const icon = await actionButton.getAttribute('ng-reflect-icon');
        expect(icon).toBeTruthy();;
        if (icon == 'pi pi-trash') {
          deleteButton = actionButton;
        }
      }
      expect(deleteButton).toBeTruthy();
      deleteButton?.click();
  
      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.delete${className}ButtonClicked({ id: '1' })
      );
    });

    it('should export csv data on export action click'`
    );
  tree.write(filePath, htmlContent);
}

function addTranslations(tree: Tree, options: DeleteGeneratorSchema) {
  const folderPath = 'src/assets/i18n/';
  const masterJsonPath = path.resolve(
    __dirname,
    './input-files/i18n/master.json.template'
  );

  const masterJsonContent = renderJsonFile(masterJsonPath, {
    ...options,
    featureConstantName: names(options.featureName).constantName,
    featureClassName: names(options.featureName).className,
  });

  tree.children(folderPath).forEach((file) => {
    updateJson(tree, joinPathFragments(folderPath, file), (json) => {
      const jsonPath = joinPathFragments(
        path.resolve(__dirname, './input-files/i18n/'),
        file + '.template'
      );
      let jsonContent = {};
      if (fs.existsSync(jsonPath)) {
        jsonContent = renderJsonFile(jsonPath, {
          ...options,
          featureConstantName: names(options.featureName).constantName,
          featureClassName: names(options.featureName).className,
        });
      }

      json = deepMerge(masterJsonContent, jsonContent, json);

      return json;
    });
  });
}

function addFunctionToOpenApi(tree: Tree, options: DeleteGeneratorSchema) {
  const openApiFolderPath = 'src/assets/swagger';
  const openApiFiles = tree.children(openApiFolderPath);
  const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
  const bffOpenApiContent = tree.read(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    'utf8'
  );

  const dataObjectName = options.dataObjectName;
  const propertyName = names(options.featureName).propertyName;
  const apiServiceName = options.apiServiceName;

  const apiUtil = new OpenAPIUtil(bffOpenApiContent);

  apiUtil.paths().set(
    `/${propertyName}/{id}`,
    {
      delete: {
        tags: [apiServiceName],
        operationId: `delete${dataObjectName}`,
        description: `Delete ${dataObjectName} by id`,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '204': {
            description: `${dataObjectName} deleted`,
          },
        },
      },
    },
    {
      existStrategy: 'extend',
    }
  );

  tree.write(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    apiUtil.finalize()
  );
}

export default createUpdateGenerator;
