import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';

export class GeneralOpenAPIStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
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
    const getByIdResponseName = options.getByIdResponseName;
    const apiUtil = new OpenAPIUtil(bffOpenApiContent);

    apiUtil.paths().set(
      `/${propertyName}/{id}`,
      {
        get: {
          'x-onecx': {
            permissions: {
              [propertyName]: ['read'],
            },
          },
          operationId: `get${dataObjectName}ById`,
          tags: [apiServiceName],
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
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${getByIdResponseName}`,
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ProblemDetailResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Not Found',
            },
            '500': {
              description: 'Internal Server Error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ProblemDetailResponse',
                  },
                },
              },
            },
          },
        },
      },
      {
        existStrategy: 'extend',
      }
    );

    apiUtil.schemas().set(dataObjectName, {
      type: 'object',
      required: ['modificationCount', 'id'],
      properties: {
        modificationCount: {
          type: 'integer',
          format: 'int32',
        },
        id: {
          type: 'string',
        },
        [COMMENT_KEY]: 'ACTION: add additional properties here',
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

    apiUtil.schemas().set(getByIdResponseName, {
      type: 'object',
      required: ['result'],
      properties: {
        result: {
          $ref: `#/components/schemas/${dataObjectName}`,
        },
      },
    });
    tree.write(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      apiUtil.finalize()
    );
  }
  getTitle(): string {
    return "Adapting OpenAPI"
  }
}
