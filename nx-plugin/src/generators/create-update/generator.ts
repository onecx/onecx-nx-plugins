import {
  formatFiles,
  generateFiles,
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

import { COMMENT_KEY, OpenAPIUtil } from '../shared/openapi/openapi.util';
import processParams, { GeneratorParameter } from '../shared/parameters.util';
import { renderJsonFile } from '../shared/renderJsonFile';
import { createCreateEndpoint, createUpdateEndpoint } from './endpoint.util';
import { CreateUpdateGeneratorSchema } from './schema';
import path = require('path');

const PARAMETERS: GeneratorParameter<CreateUpdateGeneratorSchema>[] = [
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
    key: 'createRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Create${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your create request (e.g., CreateBook): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'createResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}CreateResponse`;
    },
    prompt:
      'Provide a name for your create response (e.g., BookCreateResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'updateRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your update request (e.g., UpdateBook): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'updateResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}UpdateResponse`;
    },
    prompt:
      'Provide a name for your update response (e.g., BookUpdateResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function createUpdateGenerator(
  tree: Tree,
  options: CreateUpdateGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<CreateUpdateGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding create/update to ${options.featureName}`).start();
  const directory = '.';

  const isNgRx = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('@ngrx/'));
  if (!isNgRx) {
    spinner.fail('Currently only NgRx projects are supported.');
    throw new Error('Currently only NgRx projects are supported.');
  }

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/ngrx'),
    `${directory}/`,
    {
      ...options,
      featureFileName: names(options.featureName).fileName,
      featurePropertyName: names(options.featureName).propertyName,
      featureClassName: names(options.featureName).className,
      featureConstantName: names(options.featureName).constantName,
      dataObjectName: options.dataObjectName,
      serviceName: options.apiServiceName,
      createRequestName: options.createRequestName,
      createResponseName: options.createResponseName,
      updateRequestName: options.updateRequestName,
      updateResponseName: options.updateResponseName,
    }
  );

  adaptFeatureModule(tree, options);

  addCreateUpdateEventsToSearch(tree, options);

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

function addCreateUpdateEventsToSearch(
  tree: Tree,
  options: CreateUpdateGeneratorSchema
) {
  const fileName = names(options.featureName).fileName;
  const htmlDetailsFilePath = `src/app/${fileName}/pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component.html`;
  if (tree.exists(htmlDetailsFilePath)) {
    adaptSearchActions(tree, options);
    adaptSearchEffects(tree, options);
    adaptSearchComponent(tree, options);
    adaptSearchHTML(tree, options);
    adaptSearchTests(tree, options);
  }
}

function adaptSearchHTML(tree: Tree, options: CreateUpdateGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const constantName = names(options.featureName).constantName;
  const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

  let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
  htmlContent = htmlContent.replace(
    '<ocx-interactive-data-view',
    `<ocx-interactive-data-view 
      (editItem)="edit($event)"
      editPermission="${constantName}#EDIT"`
  );
  tree.write(htmlSearchFilePath, htmlContent);
}

function adaptSearchComponent(
  tree: Tree,
  options: CreateUpdateGeneratorSchema
) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const constantName = names(options.featureName).constantName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    `} from '@onecx/portal-integration-angular';`,
    `RowListGridData
    } from '@onecx/portal-integration-angular';`
  );
  content = content.replace(
    'const actions: Action[] = [',
    `const actions: Action[] = [
    {
     labelKey: '${constantName}_CREATE_UPDATE.ACTION.CREATE',
     icon: PrimeIcons.PLUS,
     show: 'always',
     actionCallback: () => this.create(),
    },`
  );
  content = content.replace(
    'resetSearch',
    `
    create() {
      this.store.dispatch(${className}SearchActions.create${className}ButtonClicked());
    }

    edit({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.edit${className}ButtonClicked({ id }));
    }

    resetSearch`
  );
  tree.write(filePath, content);
}

function adaptSearchActions(tree: Tree, options: CreateUpdateGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
  const className = names(options.featureName).className;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    'events: {',
    `events: {
      'Create ${className} button clicked': emptyProps(),
      'Edit ${className} button clicked': props<{
        id: number | string;
      }>(),
      'Create ${className} cancelled': emptyProps(),
      'Update ${className} cancelled': emptyProps(),
      'Create ${className} success': emptyProps(),
      'Update ${className} success': emptyProps(),
      'Create ${className} failed': props<{
        error: string | null;
      }>(),
      'Update ${className} failed': props<{
        error: string | null;
      }>(),      
    `
  );
  tree.write(filePath, content);
}

function adaptSearchEffects(tree: Tree, options: CreateUpdateGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const constantName = names(options.featureName).constantName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

  let content = tree.read(filePath, 'utf8');
  content =
    `import { PortalDialogService } from '@onecx/portal-integration-angular';` +
    `import { mergeMap } from 'rxjs';` +
    `import {
      ${options.dataObjectName},
      ${options.createRequestName},
      ${options.updateRequestName},
    } from 'src/app/shared/generated';` +
    `import { ${className}CreateUpdateComponent } from './dialogs/${options.featureName}-create-update/${options.featureName}-create-update.component';` +
    content.replace(
      'constructor(',
      `constructor(
      private portalDialogService: PortalDialogService,`
    );
  content = content.replace(
    'searchByUrl$',
    `
      refreshSearch$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${className}SearchActions.create${className}Success,
            ${className}SearchActions.update${className}Success
          ),
          concatLatestFrom(() => this.store.select(selectSearchCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
    });

    editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(${className}SearchActions.edit${className}ButtonClicked),
      concatLatestFrom(() =>
        this.store.select(${propertyName}SearchSelectors.selectResults)
      ),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id);
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog< ${options.dataObjectName} | undefined>(
          '${constantName}_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ${className}CreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit,
              }
            },
          },
          '${constantName}_CREATE_UPDATE.UPDATE.FORM.SAVE',
          '${constantName}_CREATE_UPDATE.UPDATE.FORM.CANCEL', {
            baseZIndex: 100
          }
        );
      }),
      switchMap((dialogResult) => {
        if (dialogResult.button == 'secondary') {
          return of(${className}SearchActions.update${className}Cancelled());
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!');
        }
        const itemToEditId = dialogResult.result.id;
        const itemToEdit = {
            dataObject: dialogResult.result
        } as ${options.updateRequestName};
        return this.${propertyName}Service
          .update${options.dataObjectName}(itemToEditId, itemToEdit)
          .pipe(
            map(() => {
              this.messageService.success({
                summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.SUCCESS',
              });
              return ${className}SearchActions.update${className}Success();
            })
          );
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.ERROR',
        });
        return of(
          ${className}SearchActions.update${className}Failed({
            error,
          })
        );
      })
    );
  });

  createButtonClicked$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(${className}SearchActions.create${className}ButtonClicked),
        switchMap(() => {
          return this.portalDialogService.openDialog< ${options.dataObjectName} | undefined>(
            '${constantName}_CREATE_UPDATE.CREATE.HEADER',
            {
              type: ${className}CreateUpdateComponent,
              inputs: {
                vm: {
                  itemToEdit: {},
                }
              },
            },
            '${constantName}_CREATE_UPDATE.CREATE.FORM.SAVE',
            '${constantName}_CREATE_UPDATE.CREATE.FORM.CANCEL', {
              baseZIndex: 100
            }
          );
        }),
        switchMap((dialogResult) => {
          if (dialogResult.button == 'secondary') {
            return of(${className}SearchActions.create${className}Cancelled());
          }
          if (!dialogResult?.result) {
            throw new Error('DialogResult was not set as expected!');
          }
          const toCreateItem = {
            dataObject: dialogResult.result
          } as ${options.createRequestName};
          return this.${propertyName}Service
            .create${options.dataObjectName}(toCreateItem)
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${constantName}_CREATE_UPDATE.CREATE.SUCCESS',
                });
                return ${className}SearchActions.create${className}Success();
              })
            );
        }),
        catchError((error) => {
          this.messageService.error({
            summaryKey: '${constantName}_CREATE_UPDATE.CREATE.ERROR',
          });
          return of(
            ${className}SearchActions.create${className}Failed({
              error,
            })
          );
        })
      );
    }
  );

    searchByUrl$`
  );
  tree.write(filePath, content);
}

function adaptSearchTests(tree: Tree, options: CreateUpdateGeneratorSchema) {
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
    it('should dispatch edit${className}ButtonClicked action on item edit click', async () => {
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
      let editButton;
      for (const actionButton of rowActionButtons) {
        const icon = await actionButton.getAttribute('ng-reflect-icon');
        expect(icon).toBeTruthy();;
        if (icon == 'pi pi-pencil') {
          editButton = actionButton;
        }
      }
      expect(editButton).toBeTruthy();
      editButton?.click();
  
      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.edit${className}ButtonClicked({ id: '1' })
      );
    });

    it('should dispatch create${className}ButtonClicked action on create click', async () => {
      jest.spyOn(store, 'dispatch');

      const header = await ${propertyName}Search.getHeader();
      const createButton = await (
        await header.getPageHeader()
      ).getInlineActionButtonByIcon(PrimeIcons.PLUS);

      expect(createButton).toBeTruthy();
      await createButton?.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.create${className}ButtonClicked()
      );
    });

    it('should export csv data on export action click'`
    );
  tree.write(filePath, htmlContent);
}

function adaptFeatureModule(tree: Tree, options: CreateUpdateGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const moduleFilePath = joinPathFragments(
    'src/app',
    fileName,
    fileName + '.module.ts'
  );
  let moduleContent = tree.read(moduleFilePath, 'utf8');
  moduleContent = moduleContent.replace(
    'declarations: [',
    `declarations: [${className}CreateUpdateComponent,`
  );
  moduleContent = moduleContent.replace(
    'declarations:',
    `
    providers: [providePortalDialogService()],
    declarations:`
  );
  moduleContent = moduleContent.replace(
    `from '@ngrx/effects';`,
    `from '@ngrx/effects';  
     import { ${className}CreateUpdateComponent } from './pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component';
     import { providePortalDialogService } from '@onecx/portal-integration-angular';`
  );

  tree.write(moduleFilePath, moduleContent);
}

function addTranslations(tree: Tree, options: CreateUpdateGeneratorSchema) {
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

function addFunctionToOpenApi(
  tree: Tree,
  options: CreateUpdateGeneratorSchema
) {
  const openApiFolderPath = 'src/assets/swagger';
  const openApiFiles = tree.children(openApiFolderPath);
  const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
  const bffOpenApiContent = tree.read(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    'utf8'
  );

  const dataObjectName = options.dataObjectName;
  const propertyName = names(options.featureName).propertyName;
  const createRequestName = options.createRequestName;
  const createResponseName = options.createResponseName;
  const updateRequestName = options.updateRequestName;
  const updateResponseName = options.updateResponseName;
  const apiServiceName = options.apiServiceName;

  const apiUtil = new OpenAPIUtil(bffOpenApiContent);
  // Paths
  apiUtil.paths().set(`/${propertyName}`, {
    ...createCreateEndpoint(
      {
        type: 'post',
        operationId: `create${dataObjectName}`,
        tags: [apiServiceName],
        description: `This operation performs a create.`,
      },
      {
        dataObjectName: dataObjectName,
        createRequestName: createRequestName,
        createResponseName: createResponseName,
      }
    ),
  });

  apiUtil.paths().set(
    `/${propertyName}/{id}`,
    {
      ...createUpdateEndpoint(
        {
          type: 'put',
          operationId: `update${dataObjectName}`,
          tags: [apiServiceName],
          description: `This operation performs an update.`,
        },
        {
          dataObjectName: dataObjectName,
          updateRequestSchema: updateRequestName,
          updateResponseSchema: updateResponseName,
        }
      ),
    },
    {
      existStrategy: 'extend',
    }
  );

  // Schemas
  apiUtil
    .schemas()
    .set(`${options.createRequestName}`, {
      type: 'object',
      properties: {
        dataObject: {
          type: 'object',
          '$ref': dataObjectName
        },
        [COMMENT_KEY]: 'ACTION C1: add additional properties here',
      },
    })
    .set(`${options.updateRequestName}`, {
      type: 'object',
      properties: {
        dataObject: {
          type: 'object',
          '$ref': dataObjectName
        },
        [COMMENT_KEY]: ' ACTION C1: add additional properties here',
      },
    })
    .set(`${options.createResponseName}`, {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]: 'ACTION C1: add additional properties here',
      },
    })
    .set(`${options.updateResponseName}`, {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]: ' ACTION C1: add additional properties here',
      },
    });

  apiUtil.schemas().set('ProblemDetailResponse', {
    type: 'object',
    properties: {
      errorCode: {
        type: 'string',
      },
      detail: {
        type: 'string',
      },
      params: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ProblemDetailParam',
        },
      },
      invalidParams: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ProblemDetailInvalidParam',
        },
      },
    },
  });

  apiUtil.schemas().set('ProblemDetailParam', {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      value: {
        type: 'string',
      },
    },
  });

  apiUtil.schemas().set('ProblemDetailInvalidParam', {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
    },
  });

  tree.write(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    apiUtil.finalize()
  );
}

export default createUpdateGenerator;
