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
import { CreateEditGeneratorSchema } from './schema';
import path = require('path');

const PARAMETERS: GeneratorParameter<CreateEditGeneratorSchema>[] = [
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
    key: 'creationRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Create${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your creation request (e.g., CreateBook): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'creationResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}CreationResponse`;
    },
    prompt:
      'Provide a name for your Creation Response (e.g., BookCreationResponse): ',
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
      'Provide a name for your Update Response (e.g., BookUpdateResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function createEditGenerator(
  tree: Tree,
  options: CreateEditGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<CreateEditGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding create/edit to ${options.featureName}`).start();
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
      creationRequestName: options.creationRequestName,
      creationResponseName: options.creationResponseName,
      updateRequestName: options.updateRequestName,
      updateResponseName: options.updateResponseName,
    }
  );

  adaptFeatureModule(tree, options);

  addCreateEditEventsToSearch(tree, options);

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

function addCreateEditEventsToSearch(
  tree: Tree,
  options: CreateEditGeneratorSchema
) {
  const fileName = names(options.featureName).fileName;
  const htmlDetailsFilePath = `src/app/${fileName}/dialogs/${fileName}-create-edit/${fileName}-create-edit.component.html`;
  if (tree.exists(htmlDetailsFilePath)) {
    adaptSearchActions(tree, options);
    adaptSearchEffects(tree, options);
    adaptSearchReducers(tree, options);
    adaptSearchComponent(tree, options);
    adaptSearchHTML(tree, options);
    adaptSearchState(tree, options);
    adaptSearchViewModel(tree, options);
    adaptSearchTests(tree, options);
    adaptSearchSelectors(tree, options);
  }
}

function adaptSearchHTML(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const propertyName = names(options.featureName).propertyName;
  const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

  let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
  htmlContent = htmlContent.replace(
    '<ocx-interactive-data-view',
    `<ocx-interactive-data-view \n (editItem)="edit($event)"`
  );
  htmlContent = htmlContent.replace(
    '</>',
    `<app-${fileName}-create
      [displayDetailDialog]="vm.displayDetailDialog"      
      [dataItem]="vm.dataItem"
      [changeMode]="vm.changeMode"
      (searchEmitter)="search(${propertyName}SearchFormGroup)"
      (displayDetailDialogChange)="onDetailClose()"
    ></app-${fileName}-create>
    </ocx-portal-page>`
  );
  tree.write(htmlSearchFilePath, htmlContent);
}

function adaptSearchComponent(tree: Tree, options: CreateEditGeneratorSchema) {
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
    onCreate() {
      this.store.dispatch(${className}SearchActions.createButtonClicked());
    }

    onDetailClose() {
      this.store.dispatch(${className}SearchActions.detailDialogClose());
    }

    edit({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.editButtonClicked({ id }));
    }

    resetSearch`
  );
  tree.write(filePath, content);
}

function adaptSearchActions(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    'events: {',
    `events: {
      'Create button clicked': emptyProps(),
      'Detail Dialog close': emptyProps(),
      'Edit button clicked': props<{
        id: number | string;
      }>(),
      'Data Item set': props<{
        dataItem: ${options.dataObjectName};
      }>(),
    `
  );
  tree.write(filePath, content);
}

function adaptSearchState(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.state.ts`;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    'SearchState {',
    `SearchState {
        changeMode: 'CREATE' | 'UPDATE';
        displayDetailDialog: boolean;
        dataItem: ${options.dataObjectName} | undefined;`
  );
  tree.write(filePath, content);
}

function adaptSearchViewModel(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.viewmodel.ts`;

  let content = tree.read(filePath, 'utf8');
  content =
    `import { ${options.dataObjectName} } from 'src/app/shared/generated'` +
    content.replace(
      'ViewModel {',
      `ViewModel {
        changeMode: 'CREATE' | 'UPDATE';
        displayDetailDialog: boolean;
        dataItem: ${options.dataObjectName} | undefined;`
    );
  tree.write(filePath, content);
}

function adaptSearchSelectors(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.selectors.ts`;

  let content = tree.read(filePath, 'utf8');
  content = content.replace(
    'SearchSelectors.selectChartVisible',
    `SearchSelectors.selectChartVisible,
    ${propertyName}SearchSelectors.selectChangeMode,
    ${propertyName}SearchSelectors.selectDisplayDetailDialog,
    ${propertyName}SearchSelectors.selectDataItem`
  );
  content = content.replaceAll(
    `chartVisible`,
    `chartVisible,
    changeMode,
    displayDetailDialog,
    dataItem`
  );
  tree.write(filePath, content);
}

function adaptSearchReducers(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.reducers.ts`;

  let content = tree.read(filePath, 'utf8');

  content = content.replace(
    `SearchState = {`,
    `SearchState = {
        changeMode: 'CREATE',
        displayDetailDialog: false,
        dataItem: undefined,`
  );

  content = content.replace(
    `createReducer(
  initialState,`,
    `createReducer(
  initialState,
     on(
    ${className}SearchActions.createButtonClicked,
    (state: ${className}SearchState): ${className}SearchState => ({
      ...state,
      changeMode: 'CREATE',
      displayDetailDialog: true,
      dataItem: { id: 'new' },
    })
  ),
  on(
    ${className}SearchActions.detailDialogClose,
    (state: ${className}SearchState): ${className}SearchState => ({
      ...state,
      changeMode: 'CREATE',
      displayDetailDialog: false,
      dataItem: undefined,
    })
  ),
  on(
    ${className}SearchActions.dataItemSet,
    (
      state: ${className}SearchState,
      { dataItem }
    ): ${className}SearchState => ({
      ...state,
      changeMode: 'UPDATE',
      displayDetailDialog: true,
      dataItem: dataItem,
    })
  ),`
  );

  tree.write(filePath, content);
}

function adaptSearchEffects(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent =
    `import { selectUrl } from 'src/app/shared/selectors/router.selectors';` +
    htmlContent.replace(
      'searchByUrl$',
      `editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(${className}SearchActions.editButtonClicked),
      concatLatestFrom(() =>
        this.store.select(${propertyName}SearchSelectors.selectResults)
      ),
      map(([action, results]) => {
        const dataItem = results.filter((item) => item.id == action.id)[0];
        return ${className}SearchActions.dataItemSet({
          dataItem,
        });
      })
    );
  });
    
    searchByUrl$`
    );
  tree.write(filePath, htmlContent);
}

function adaptSearchTests(tree: Tree, options: CreateEditGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent = htmlContent.replace(
    "it('should export csv data on export action click'",
    `
    it('should dispatch editButtonClicked action on item edit click', async () => {
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
  
      expect(rowActionButtons.length).toEqual(1);
      expect(await rowActionButtons[0].getAttribute('ng-reflect-icon')).toEqual(
        'pi pi-pencil'
      );
      await rowActionButtons[0].click();
  
      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.editButtonClicked({ id: '1' })
      );
    });

    it('should export csv data on export action click'`
  );
  tree.write(filePath, htmlContent);
}

function adaptFeatureModule(tree: Tree, options: CreateEditGeneratorSchema) {
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
    `declarations: [${className}CreateEditComponent,`
  );
  moduleContent = moduleContent.replace(
    `from '@ngrx/effects';`,
    `from '@ngrx/effects';  
  import { ${className}CreateEditComponent } from './pages/${fileName}-create-edit/${fileName}-create-edit.component';`
  );

  tree.write(moduleFilePath, moduleContent);
}

// function adaptAppModule(tree: Tree) {
//   const moduleFilePath = joinPathFragments('src/app/app.module.ts');
//   let moduleContent = tree.read(moduleFilePath, 'utf8');
//   if (!moduleContent.includes('providers: [providePortalDialogService(),')) {
//     moduleContent = moduleContent.replace(
//       'providers: [',
//       `providers: [providePortalDialogService(),`
//     );
//   }

//   if (
//     !moduleContent.includes(
//       `providePortalDialogService } from '@onecx/portal-integration-angular'`
//     )
//   ) {
//     moduleContent = moduleContent.replace(
//       `} from '@onecx/portal-integration-angular'`,
//       `, providePortalDialogService } from '@onecx/portal-integration-angular'`
//     );
//   }

//   tree.write(moduleFilePath, moduleContent);
// }

// function adaptFeatureRoutes(tree: Tree, options: CreateEditGeneratorSchema) {
//   const fileName = names(options.featureName).fileName;
//   const className = names(options.featureName).className;
//   const routesFilePath = joinPathFragments(
//     'src/app',
//     fileName,
//     fileName + '.routes.ts'
//   );
//   let moduleContent = tree.read(routesFilePath, 'utf8');
//   moduleContent = moduleContent.replace(
//     'routes: Routes = [',
//     `routes: Routes = [ { path: '', component: ${className}SearchComponent, pathMatch: 'full' },`
//   );

//   moduleContent =
//     `import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';` +
//     moduleContent;
//   tree.write(routesFilePath, moduleContent);
// }

function addTranslations(tree: Tree, options: CreateEditGeneratorSchema) {
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

function addFunctionToOpenApi(tree: Tree, options: CreateEditGeneratorSchema) {
  const openApiFolderPath = 'src/assets/swagger';
  const openApiFiles = tree.children(openApiFolderPath);
  const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
  const bffOpenApiContent = tree.read(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    'utf8'
  );

  const dataObjectName = options.dataObjectName;
  const propertyName = names(options.featureName).propertyName;
  const creationRequestName = options.creationRequestName;
  const creationResponseName = options.creationResponseName;
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
        description: `This operation performs a creation.`,
      },
      {
        dataObjectName: dataObjectName,
        creationRequestSchema: creationRequestName,
        creationResponseSchema: creationResponseName,
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
    .set(`${options.creationRequestName}`, {
      type: 'object',
      properties: {
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]: 'ACTION S1: add additional properties here',
      },
    })
    .set(`${options.updateRequestName}`, {
      type: 'object',
      properties: {
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]: ' ACTION S1: add additional properties here',
      },
    })
    .set(`${options.creationResponseName}`, {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]: 'ACTION S1: add additional properties here',
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
        [COMMENT_KEY]: ' ACTION S1: add additional properties here',
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

export default createEditGenerator;
