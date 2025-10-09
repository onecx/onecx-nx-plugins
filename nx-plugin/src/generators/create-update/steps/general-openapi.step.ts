import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { createCreateEndpoint, createUpdateEndpoint } from '../endpoint.util';

export class GeneralOpenAPIStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
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
            $ref: `#/components/schemas/${dataObjectName}`,
          },
        },
      })
      .set(`${options.updateRequestName}`, {
        type: 'object',
        properties: {
          dataObject: {
            type: 'object',
            $ref: `#/components/schemas/${dataObjectName}`,
          },
        },
      })
      .set(`${options.createResponseName}`, {
        type: 'object',
        properties: {
          dataObject: {
            type: 'object',
            $ref: `#/components/schemas/${dataObjectName}`,
          },
          [COMMENT_KEY]:
            'ACTION C1: modify resource or use flat list here. https://onecx.github.io/docs/nx-plugins/current/general/getting_started/create-update/extend-form-fields.html#action-1',
        },
      })
      .set(`${options.updateResponseName}`, {
        type: 'object',
        properties: {
          dataObject: {
            type: 'object',
            $ref: `#/components/schemas/${dataObjectName}`,
          },
          [COMMENT_KEY]:
            'ACTION C1: modify resource or use flat list here. https://onecx.github.io/docs/nx-plugins/current/general/getting_started/create-update/extend-form-fields.html#action-1',
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
    return 'Adapting OpenAPI';
  }
}
