import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { DeleteGeneratorSchema } from '../schema';

export class GeneralOpenAPIStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/swagger';
    const openApiFiles = tree.children(openApiFolderPath);
    const bffOpenApiPath = openApiFiles.find((f) => f.endsWith('-bff.yaml'));
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const resource = options.resource;
    const propertyName = names(options.featureName).propertyName;
    const apiServiceName = names(options.apiServiceName).propertyName;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);

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

    tree.write(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      apiUtil.finalize()
    );
  }
  getTitle(): string {
    return 'Adapting OpenAPI';
  }
}
