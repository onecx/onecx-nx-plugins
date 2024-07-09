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
        required: ['id'],
        properties: {
          modificationCount: {
            type: 'integer',
            format: 'int32',
          },
          id: {
            type: 'string',
          },
          [COMMENT_KEY]: 'ACTION S1: add additional properties here',
        },
      })
      .set(`${searchRequestName}`, {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            maximum: 2500,
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
  getName(): string {
    return "Adapting OpenAPI"
  }
}
