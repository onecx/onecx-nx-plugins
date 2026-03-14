import { Tree, joinPathFragments, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { DeleteGeneratorSchema } from '../schema';

export class GeneralOpenAPIStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const propertyName = names(options.resource).propertyName;
    const className = names(options.resource).className;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);

    apiUtil.paths().set(
      `/${propertyName}s/{id}`,
      {
        delete: {
          'x-onecx': {
            permissions: {
              [`${propertyName}`]: ['delete']
            },
          },
          tags: [propertyName],
          operationId: `delete${className}ById`,
          description: `Delete ${className} by id`,
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
              description: `${className} deleted`,
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
              description: `${className} not found`
            }
          }
        }
      },
      {
        existStrategy: 'extend',
      }
    );

    tree.write(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      apiUtil.finalize()
    );
  }
  getTitle(): string {
    return 'Adapting OpenAPI';
  }
}
