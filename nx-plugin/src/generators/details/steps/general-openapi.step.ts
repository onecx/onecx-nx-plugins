import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { createUpdateEndpoint } from '../../create-update/endpoint.util';

export class GeneralOpenAPIStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const openApiFiles = tree.children(openApiFolderPath);
    const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const dataObjectName = options.dataObjectName;
    const propertyName = names(options.featureName).propertyName;
    const apiServiceName = names(options.apiServiceName).propertyName;
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
            '404': {
              description: 'Not Found',
            }
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

      // Schemas for editMode
      apiUtil
        .schemas()
        .set(`${options.updateRequestName}`, {
          type: 'object',
          properties: {
            resource: {
              type: 'object',
              $ref: `#/components/schemas/${dataObjectName}`,
            },
          },
        })
        .set(`${options.updateResponseName}`, {
          type: 'object',
          properties: {
            resource: {
              type: 'object',
              $ref: `#/components/schemas/${dataObjectName}`,
            },
            [COMMENT_KEY]:
              'ACTION DE1: modify data object or use flat list here. https://onecx.github.io/docs/nx-plugins/current/general/getting_started/create-update/extend-form-fields.html#action-1',
          },
        });
    }

    if (options.allowDelete) {
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
    }

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
      required: ['resource'],
      properties: {
        resource: {
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
