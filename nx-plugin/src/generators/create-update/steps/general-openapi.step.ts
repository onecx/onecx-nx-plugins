import { Tree, joinPathFragments, names } from '@nx/devkit';

import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';
import { createCreateEndpoint, createUpdateEndpoint } from '../endpoint.util';

export class GeneralOpenAPIStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const resource = options.resource;
    const propertyName = names(options.featureName).propertyName;
    const createRequestName = options.createRequestName;
    const createResponseName = options.createResponseName;
    const updateRequestName = options.updateRequestName;
    const updateResponseName = options.updateResponseName;
    const apiServiceName = options.apiServiceName;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    // Paths
    apiUtil.paths().set(`/${propertyName}s`, {
      ...createCreateEndpoint(
        {
          type: 'post',
          operationId: `create${resource}`,
          tags: [apiServiceName],
          description: `This operation performs a create.`,
        },
        {
          resource: resource,
          propertyName: propertyName,
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
            operationId: `update${resource}ById`,
            tags: [apiServiceName],
            description: `This operation performs an update.`,
          },
          {
            resource: resource,
            propertyName: propertyName,
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
            $ref: `#/components/schemas/${resource}`,
          },
        },
      })
      .set(`${options.updateRequestName}`, {
        type: 'object',
        properties: {
          dataObject: {
            $ref: `#/components/schemas/${resource}`,
          },
        },
      })
      .set(`${options.createResponseName}`, {
        type: 'object',
        properties: {
          dataObject: {
            $ref: `#/components/schemas/${resource}`,
          },
          [COMMENT_KEY]: 'ACTION C1: modify resource or use flat list here',
        },
      })
      .set(`${options.updateResponseName}`, {
        type: 'object',
        properties: {
          dataObject: {
            $ref: `#/components/schemas/${resource}`,
          },
          [COMMENT_KEY]: 'ACTION C1: modify resource or use flat list here',
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
  getTitle(): string {
    return 'Adapting OpenAPI (create/update)';
  }
}
