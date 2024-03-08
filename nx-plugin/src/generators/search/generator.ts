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
import { renderJsonFile } from '../shared/renderJsonFile';
import { updateYaml } from '../shared/yaml';
import { SearchGeneratorSchema } from './schema';
import path = require('path');

export async function searchGenerator(
  tree: Tree,
  options: SearchGeneratorSchema
): Promise<GeneratorCallback> {
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
    }
  );

  adaptRemoteModule(tree);

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
  moduleContent = moduleContent.replace(
    'providers: [',
    `providers: [DialogService,`
  );

  moduleContent = moduleContent.replace(
    `} from '@onecx/portal-integration-angular'`,
    `} from '@onecx/portal-integration-angular' \n import { DialogService } from 'primeng/dynamicdialog'; `
  );

  tree.write(moduleFilePath, moduleContent);
}

function adaptRemoteModule(tree: Tree) {
  const remoteModuleFolderPath = 'src/app';
  const remoteModuleFile = tree.children(remoteModuleFolderPath);
  const remoteModuleFilePath = remoteModuleFile.find((f) =>
    f.endsWith('-app.remote.module.ts')
  );

  let remoteModuleContent = tree.read(
    joinPathFragments(remoteModuleFolderPath, remoteModuleFilePath),
    'utf8'
  );

  remoteModuleContent = remoteModuleContent.replace(
    `} from '@onecx/portal-integration-angular'`,
    `} from '@onecx/portal-integration-angular' \n import { DialogService } from 'primeng/dynamicdialog'; `
  );
  remoteModuleContent = remoteModuleContent.replace(
    'providers: [',
    `providers: [DialogService,`
  );

  tree.write(
    joinPathFragments(remoteModuleFolderPath, remoteModuleFilePath),
    remoteModuleContent
  );
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

  if(tree.exists(folderPath)) {
    updateYaml(tree, folderPath, (yaml) => {
      yaml['app'] ??= {};
      yaml['app']['operator'] ??= {};
      yaml['app']['operator']['permission'] ??= {};
      yaml['app']['operator']['permission']['spec'] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'][
        constantName
      ] ??= {};
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'CREATE'
      ] ??= `Create ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'EDIT'
      ] ??= `Edit ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'DELETE'
      ] ??= `Delete ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'SAVE'
      ] ??= `Update and save ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'IMPORT'
      ] ??= `Import ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'EXPORT'
      ] ??= `Export ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'VIEW'
      ] ??= `View mode for ${propertyName}`;
      yaml['app']['operator']['permission']['spec']['permissions'][constantName][
        'SEARCH'
      ] ??= `Seaarch ${propertyName}`;
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
  let bffOpenApiContent = tree.read(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    'utf8'
  );

  const className = names(options.featureName).className;
  const propertyName = names(options.featureName).propertyName;
  const hasSchemas = bffOpenApiContent.includes('schemas:');
  const hasEntitySchema =
    hasSchemas && bffOpenApiContent.includes(`${className}:`);

  //TODO: schema for error cases
  bffOpenApiContent = bffOpenApiContent.replace(`paths: {}`, `paths:`).replace(
    `paths:`,
    `
paths:
  /${propertyName}/search:
    post:
      operationId: search${className}s
      tags:
        - ${className}
      description: This operation performs a search based on provided search criteria. Search for ${propertyName} results.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/${className}SearchRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${className}SearchResponse'
        '400':
          description: Bad request
        '500':
          description: Something went wrong

  /searchConfig/{configId}:
    put:
      tags:
        - SearchConfig
      summary: Updates the search config specified by the configId
      description: Updates the search config and returns the updated list of search configs  by page
      operationId: updateSearchConfig
      parameters:
        - name: configId
          in: path
          description: ConfigId for the search config to be updated
          required: true
          schema:
            type: string
      requestBody:
        description: Updated values for the specified search config
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateSearchConfigRequest'
        required: true
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UpdateSearchConfigResponse'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
    delete:
      tags:
        - SearchConfig
      summary: Deletes the search config
      description: Deletes the search config
      operationId: deleteSearchConfig
      parameters:
        - name: configId
          in: path
          description: ConfigId for the searchConfig to be deleted
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
  /searchConfig/infos/{page}:
    get:
      tags:
        - SearchConfig
      summary: Gets the search config infos for the specified page.
      description: The search config infos for the page is returned.
      operationId: getSearchConfigInfos
      parameters:
        - name: page
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetSearchConfigInfosResponse'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
  /searchConfig/{id}:
    get:
      tags:
        - SearchConfig
      summary: Gets the search config infos for the specified page.
      description: The search config for the page is returned.
      operationId: getSearchConfig
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GetSearchConfigResponse"
        "404":
          description: Not found
        "400":
          description: Bad request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProblemDetailResponse"
        "500":
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProblemDetailResponse"

  /searchConfig/:
    post:
      tags:
        - SearchConfig
      summary: Creates a new search config
      description: Creates a new search config and returns the updated list of search configs by page
      operationId: createSearchConfig
      requestBody:
        description: Creates a new search config
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSearchConfigRequest'
        required: true
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateSearchConfigResponse'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetailResponse'
`
  );
  if (!hasSchemas) {
    bffOpenApiContent += `
components:
    schemas:`;
  }

  let entitySchema = `
      ${className}:
        type: object
        required:
          - "modificationCount"
          - "id"
        properties:
          modificationCount:
            type: integer
            format: int32
          id:
            type: integer
            format: int64
          # ACTION S8: add additional properties here`;

  if (hasEntitySchema) {
    entitySchema = '';
  }

  bffOpenApiContent = bffOpenApiContent.replace(
    `
    schemas:`,
    `
    schemas:
      ${entitySchema}

      ${className}SearchRequest:
        type: object
        properties:
          limit:
            type: integer
            maximum: 2500
          id:
            type: integer
            format: int64
          changeMe:
            type: string
          # ACTION S8: add additional properties here

      ${className}SearchResponse:
        type: object
        required:
        - "results"
        - "totalNumberOfResults"
        properties:
          results:
            type: array
            items:
              $ref: '#/components/schemas/${className}SearchResult'
          totalNumberOfResults:
            description: Total number of results on the server.
            type: integer
            format: int64

      ${className}SearchResult:
        type: object
        required:
        - "${propertyName}"
        properties:
          ${propertyName}:
            $ref: '#/components/schemas/${className}'
          # ACTION S8: add additional properties here
      
      SearchConfigInfo:
        required:
          - id
          - name
        properties:
          id:
            type: string
          name:
            type: string

      SearchConfig:
        allOf:
        - $ref: "#/components/schemas/SearchConfigInfo"
        type: object
        required:
          - name
          - modificationCount
          - fieldListVersion
          - isReadonly
          - isAdvanced
          - columns
          - values
        properties:
          id:
            type: string
          page:
            type: string
          name:
            type: string
          modificationCount:
            type: integer
          fieldListVersion:
            type: integer
            description: Version increment of the fields in the UI which you should use when you are making incompatible changes to those fields.
          isReadonly:
            type: boolean
            description: Defines whether this config can be changed in the UI
          isAdvanced:
            type: boolean
            description: Indicates whether the advanced mode should be displayed
          columns:
            type: array
            items:
              type: string
          values:
            type: object
            additionalProperties:
              type: string
              
      GetSearchConfigInfosResponse:
        allOf:
          - $ref: '#/components/schemas/SearchConfigInfoList'

      GetSearchConfigResponse:
        type: object
        required:
          - config
        properties:
          config:
            $ref: "#/components/schemas/SearchConfig"
              
      CreateSearchConfigRequest:
        type: object
        required:
          - 'page'
          - 'name'
          - 'fieldListVersion'
          - 'isReadonly'
          - 'isAdvanced'
          - 'columns'
          - 'values'
        properties:
          page:
            type: string
          name:
            type: string
          fieldListVersion:
            type: integer
            description: Version increment of the fields in the UI which you should use when you are making incompatible changes to those fields.
          isReadonly:
            type: boolean
            description: Defines whether this config can be changed in the UI
          isAdvanced:
            type: boolean
            description: Indicates whether the advanced mode should be displayed
          columns:
            type: array
            items:
              type: string
          values:
            type: object
            additionalProperties:
              type: string
              
      CreateSearchConfigResponse:
        allOf:
          - $ref: '#/components/schemas/SearchConfigInfoList'
          
      UpdateSearchConfigRequest:
        type: object
        required: 
          - searchConfig
        properties:
          searchConfig:
            $ref: '#/components/schemas/SearchConfig'
              
      UpdateSearchConfigResponse:
        allOf:
          - $ref: '#/components/schemas/SearchConfigInfoList'
      
      SearchConfigInfoList:
        type: object
        required:
          - totalElements
          - configs
        properties:
          totalElements:
            format: int64
            description: The total elements in the resource.
            type: integer
          configs:
            type: array
            items:
              $ref: '#/components/schemas/SearchConfigInfo'
              
      ProblemDetailResponse:
        type: object
        properties:
          errorCode:
            type: string
          detail:
            type: string
          params:
            type: array
            items:
              $ref: '#/components/schemas/ProblemDetailParam'
          invalidParams:
            type: array
            items:
              $ref: '#/components/schemas/ProblemDetailInvalidParam'
              
      ProblemDetailParam:
        type: object
        properties:
          key:
            type: string
          value:
            type: string
            
      ProblemDetailInvalidParam:
        type: object
        properties:
          name:
            type: string
          message:
            type: string
  `
  );

  tree.write(
    joinPathFragments(openApiFolderPath, bffOpenApiPath),
    bffOpenApiContent
  );
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
