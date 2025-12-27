import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { createUpdateEndpoint } from '../../create-update/endpoint.util';

export class GeneralOpenAPIStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/swagger';
    const openApiFiles = tree.children(openApiFolderPath);
    const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const resource = options.resource;
    const propertyName = names(options.featureName).propertyName;
    const apiServiceName = options.apiServiceName;
    const getByIdResponseName = options.getByIdResponseName;
    const apiUtil = new OpenAPIUtil(bffOpenApiContent);

    const updateRequestName = options.updateRequestName;
    const updateResponseName = options.updateResponseName;

    apiUtil.paths().set(
      `/${propertyName}/{id}`,
      {
        get: {
          'x-onecx': {
            permissions: {
              [propertyName]: ['read'],
            },
          },
          operationId: `get${resource}ById`,
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

    if (options.editMode) {
      // Paths for editMode
      apiUtil.paths().set(
        `/${propertyName}/{id}`,
        {
          ...createUpdateEndpoint(
            {
              type: 'put',
              operationId: `update${resource}`,
              tags: [apiServiceName],
              description: `This operation performs an update.`,
            },
            {
              resource: resource,
              updateRequestSchema: updateRequestName,
              updateResponseSchema: updateResponseName,
            }
          ),
        },
        {
          existStrategy: 'extend',
        }
      );

      // Schemas for editMode
      apiUtil
        .schemas()
        .set(`${options.updateRequestName}`, {
          type: 'object',
          properties: {
            dataObject: {
              type: 'object',
              $ref: `#/components/schemas/${resource}`,
            },
          },
        })
        .set(`${options.updateResponseName}`, {
          type: 'object',
          properties: {
            dataObject: {
              type: 'object',
              $ref: `#/components/schemas/${resource}`,
            },
            [COMMENT_KEY]:
              'ACTION DE1: modify resource or use flat list here. https://onecx.github.io/docs/documentation/current/onecx-nx-plugins:generator/create-update/extend-form-fields.html#action-1',
          },
        });
    }

    if (options.allowDelete) {
      apiUtil.paths().set(
        `/${propertyName}/{id}`,
        {
          delete: {
            tags: [apiServiceName],
            operationId: `delete${resource}`,
            description: `Delete ${resource} by id`,
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
                description: `${resource} deleted`,
              },
            },
          },
        },
        {
          existStrategy: 'extend',
        }
      );
    }

    apiUtil.schemas().set(resource, {
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
        resource: {
          $ref: `#/components/schemas/${resource}`,
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
