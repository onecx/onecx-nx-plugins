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
import { updateYaml } from '../shared/yaml';
import { createSearchEndpoint } from './endpoint.util';
import { SearchGeneratorSchema } from './schema';
import path = require('path');

const PARAMETERS: GeneratorParameter<SearchGeneratorSchema>[] = [
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
    key: 'searchRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}SearchRequest`;
    },
    prompt:
      'Provide a name for your Search Request (e.g., BookSearchRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'searchResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}SearchResponse`;
    },
    prompt:
      'Provide a name for your Search Response (e.g., BookSearchResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function searchGenerator(
  tree: Tree,
  options: SearchGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<SearchGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding search to ${options.featureName}`).start();
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
      searchRequestName: options.searchRequestName,
      searchResponseName: options.searchResponseName,
    }
  );

  adaptAppModule(tree);

  adaptFeatureModule(tree, options);

  adaptFeatureRoutes(tree, options);

  adaptFeatureState(tree, options);

  adaptFeatureReducer(tree, options);

  addDetailsEventsToSearch(tree, options);

  addTranslations(tree, options);

  addFunctionToOpenApi(tree, options);

  addPermissionDefinitionsToValuesYaml(tree, options);

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

function addDetailsEventsToSearch(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const htmlDetailsFilePath = `src/app/${fileName}/pages/${fileName}-details/${fileName}-details.component.html`;
  if (tree.exists(htmlDetailsFilePath)) {
    adaptSearchHTML(tree, options);
    adaptSearchComponent(tree, options);
    adaptSearchActions(tree, options);
    adaptSearchEffects(tree, options);
    adaptSearchTests(tree, options);
  }
}

function adaptSearchHTML(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

  let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
  htmlContent = htmlContent.replace(
    '<ocx-interactive-data-view',
    `<ocx-interactive-data-view \n (viewItem)="details($event)"`
  );
  tree.write(htmlSearchFilePath, htmlContent);
}

function adaptSearchComponent(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent =
    `import {RowListGridData} from '@onecx/portal-integration-angular';` +
    htmlContent.replace(
      'resetSearch',
      `
    details({id}:RowListGridData) {
      this.store.dispatch(${className}SearchActions.detailsButtonClicked({id}));
    }

    resetSearch`
    );
  tree.write(filePath, htmlContent);
}

function adaptSearchActions(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent = htmlContent.replace(
    'events: {',
    `events: {
      'Details button clicked': props<{
        id: number | string;
      }>(),
    `
  );
  tree.write(filePath, htmlContent);
}

function adaptSearchEffects(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent =
    `import { selectUrl } from 'src/app/shared/selectors/router.selectors';` +
    htmlContent.replace(
      'searchByUrl$',
      `detailsButtonClicked$ = createEffect(
      () => {
        return this.actions$.pipe(
          ofType(${className}SearchActions.detailsButtonClicked),
          concatLatestFrom(() => this.store.select(selectUrl)),
          tap(([action, currentUrl]) => {
            let urlTree = this.router.parseUrl(currentUrl);
            urlTree.queryParams = {};
            urlTree.fragment = null;
            this.router.navigate([urlTree.toString(), 'details', action.id]);
        })
      )},
      { dispatch: false }
    );
    
    searchByUrl$`
    );
  tree.write(filePath, htmlContent);
}

function adaptSearchTests(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

  let htmlContent = tree.read(filePath, 'utf8');
  htmlContent = htmlContent.replace(
    "it('should export csv data on export action click'",
    `
    it('should dispatch detailsButtonClicked action on item details click', async () => {
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
        'pi pi-eye'
      );
      await rowActionButtons[0].click();
  
      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.detailsButtonClicked({ id: '1' })
      );
    });

    it('should export csv data on export action click'`
  );
  tree.write(filePath, htmlContent);
}

function adaptFeatureModule(tree: Tree, options: SearchGeneratorSchema) {
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
    `declarations: [${className}SearchComponent,`
  );
  moduleContent = moduleContent.replace(
    `} from '@onecx/portal-integration-angular'`,
    `InitializeModuleGuard, } from '@onecx/portal-integration-angular'`
  );
  moduleContent = moduleContent.replace(
    'EffectsModule.forFeature()',
    `EffectsModule.forFeature([])`
  );
  moduleContent = moduleContent.replace(
    'EffectsModule.forFeature([',
    `EffectsModule.forFeature([${className}SearchEffects,`
  );
  moduleContent = moduleContent.replace(
    `from '@ngrx/effects';`,
    `from '@ngrx/effects';
  import { ${className}SearchEffects } from './pages/${fileName}-search/${fileName}-search.effects';
  import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';`
  );

  tree.write(moduleFilePath, moduleContent);
}

function adaptAppModule(tree: Tree) {
  const moduleFilePath = joinPathFragments('src/app/app.module.ts');
  let moduleContent = tree.read(moduleFilePath, 'utf8');
  if (!moduleContent.includes('providers: [providePortalDialogService(),')) {
    moduleContent = moduleContent.replace(
      'providers: [',
      `providers: [providePortalDialogService(),`
    );
  }

  if (
    !moduleContent.includes(
      `providePortalDialogService } from '@onecx/portal-integration-angular'`
    )
  ) {
    moduleContent = moduleContent.replace(
      `} from '@onecx/portal-integration-angular'`,
      `, providePortalDialogService } from '@onecx/portal-integration-angular'`
    );
  }

  tree.write(moduleFilePath, moduleContent);
}

function adaptFeatureRoutes(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const routesFilePath = joinPathFragments(
    'src/app',
    fileName,
    fileName + '.routes.ts'
  );
  let moduleContent = tree.read(routesFilePath, 'utf8');
  moduleContent = moduleContent.replace(
    'routes: Routes = [',
    `routes: Routes = [ { path: '', component: ${className}SearchComponent, pathMatch: 'full' },`
  );

  moduleContent =
    `import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';` +
    moduleContent;
  tree.write(routesFilePath, moduleContent);
}

function addPermissionDefinitionsToValuesYaml(
  tree: Tree,
  options: SearchGeneratorSchema
) {
  const constantName = names(options.featureName).constantName;
  const propertyName = names(options.featureName).propertyName;

  const folderPath = 'helm/values.yaml';

  if (tree.exists(folderPath)) {
    updateYaml(tree, folderPath, (yaml) => {
      yaml['app'] ??= {};
      yaml['app']['operator'] ??= {};
      yaml['app']['operator']['permission'] ??= {};
      yaml['app']['operator']['permission']['spec'] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['CREATE'] ??= `Create ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['EDIT'] ??= `Edit ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['DELETE'] ??= `Delete ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['SAVE'] ??= `Update and save ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['IMPORT'] ??= `Import ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['EXPORT'] ??= `Export ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['VIEW'] ??= `View mode for ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ]['SEARCH'] ??= `Search ${propertyName}`;
      return yaml;
    });
  }
}

function addTranslations(tree: Tree, options: SearchGeneratorSchema) {
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

function addFunctionToOpenApi(tree: Tree, options: SearchGeneratorSchema) {
  const openApiFolderPath = 'src/assets/swagger';
  const openApiFiles = tree.children(openApiFolderPath);
  const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
  const bffOpenApiContent = tree.read(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    'utf8'
  );

  const dataObjectName = options.dataObjectName;
  const propertyName = names(options.featureName).propertyName;
  const searchRequestName = options.searchRequestName;
  const searchResponseName = options.searchResponseName;
  const apiServiceName = options.apiServiceName;

  const apiUtil = new OpenAPIUtil(bffOpenApiContent);
  const res = apiUtil
    .paths()
    .set(
      `/${propertyName}/search`,
      createSearchEndpoint(
        {
          type: 'post',
          operationId: `search${dataObjectName}s`,
          tags: [apiServiceName],
          description: `This operation performs a search based on provided search criteria. Search for ${propertyName} results.`,
        },
        {
          dataObjectName: dataObjectName,
          searchRequestName: searchRequestName,
          searchResponseName: searchResponseName,
        }
      )
    )
    .done()
    .schemas()
    .set(`${dataObjectName}`, {
      type: 'object',
      required: ['modificationCount', 'id'],
      properties: {
        modificationCount: {
          type: 'integer',
          format: 'int32',
        },
        id: {
          type: 'integer',
          format: 'int32',
        },
        [COMMENT_KEY]: 'ACTION S1: add additional properties here',
      },
    })
    .set(`${searchRequestName}`, {
      type: 'object',
      required: ['id'],
      properties: {
        limit: {
          type: 'integer',
          format: 'int32',
        },
        id: {
          type: 'integer',
          format: 'int32',
        },
        changeMe: {
          type: 'string',
        },
        [COMMENT_KEY]:
          ' ACTION S1: Add additional properties to the <feature>-bff.yaml',
      },
    })
    .set(`${searchResponseName}`, {
      type: 'object',
      required: ['results', 'totalNumberOfResults'],
      properties: {
        results: {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${dataObjectName}`,
          },
        },
        totalNumberOfResults: {
          type: 'integer',
          format: 'int32',
          description: 'Total number of results on the server.',
        },
      },
    })
    .done()
    .finalize();

  tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
}

function adaptFeatureState(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const className = names(options.featureName).className;
  const filePath = `src/app/${fileName}/${fileName}.state.ts`;

  let fileContent = tree.read(filePath, 'utf8');

  fileContent = fileContent.replace(
    '{',
    `{
    search: ${className}SearchState;
  `
  );

  fileContent =
    `import { ${className}SearchState } from './pages/${fileName}-search/${fileName}-search.state';` +
    fileContent;
  tree.write(filePath, fileContent);
}

function adaptFeatureReducer(tree: Tree, options: SearchGeneratorSchema) {
  const fileName = names(options.featureName).fileName;
  const propertyName = names(options.featureName).propertyName;
  const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;

  let fileContent = tree.read(filePath, 'utf8');

  fileContent = fileContent.replace(
    '>({',
    `>({
    search: ${propertyName}SearchReducer,`
  );

  fileContent =
    `import { ${propertyName}SearchReducer } from './pages/${fileName}-search/${fileName}-search.reducers';` +
    fileContent;
  tree.write(filePath, fileContent);
}

export default searchGenerator;
