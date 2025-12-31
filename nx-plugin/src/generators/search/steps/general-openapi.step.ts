import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { createSearchEndpoint } from '../endpoint.util';

export class GeneralOpenAPIStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/swagger';
    const openApiFiles = tree.children(openApiFolderPath);
    const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const resource = options.resource;
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
            operationId: `search${resource}s`,
            tags: [apiServiceName],
            description: `This operation performs a search based on provided search criteria. Search for ${propertyName} results.`,
          },
          {
            resource: resource,
            searchRequestName: searchRequestName,
            searchResponseName: searchResponseName,
          }
        )
      )
      .done()
      .schemas()
      .set(`${resource}`, {
        type: 'object',
        required: ['id'],
        properties: {
          modificationCount: {
            type: 'integer',
            format: 'int32',
          },
          id: {
            type: 'string',
          },
          [COMMENT_KEY]: 'ACTION S5: Add additional properties: https://onecx.github.io/docs/documentation/current/onecx-nx-plugins:generator/search/configure-search-results.html#action-5',
        },
      })
      .set(`${searchRequestName}`, {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
          },
          pageNumber: {
            type: 'integer',
            format: 'int32',
            default: 0,
            description: 'The number of the page',
          },
          pageSize: {
            type: 'integer',
            format: 'int32',
            default: 100,
            maximum: 1000,
            description: 'The size of the page.'
          },
          changeMe: {
            type: 'string',
          },
          [COMMENT_KEY]:
            ' ACTION S1: Add additional properties: https://onecx.github.io/docs/documentation/current/onecx-nx-plugins:generator/search/configure-search-criteria.html#action-1',
        },
      })
      .set(`${searchResponseName}`, {
        type: 'object',
        required: ['stream', 'size', 'number', 'totalPages', 'totalElements'],
        properties: {
          stream: {
            type: 'array',
            items: {
              $ref: `#/components/schemas/${resource}`,
            },
          },
          size: {
            type: 'integer',
            format: 'int32',
            description: 'Current page size.',
          },
          number: {
            type: 'integer',
            format: 'int32',
            description: 'Current page number.',
          },
          totalElements: {
            type: 'integer',
            format: 'int64',
            description: 'Total number of results on the server.',
          },
          totalPages: {
            type: 'integer',
            format: 'int64',
            description: 'Total pages.',
          },
        },
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }
  getTitle(): string {
    return "Adapting OpenAPI"
  }
}
