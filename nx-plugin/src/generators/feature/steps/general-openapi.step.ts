import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { FeatureGeneratorSchema } from '../schema';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';

export class GeneralOpenAPIStep implements GeneratorStep<FeatureGeneratorSchema> {
  process(tree: Tree, options: FeatureGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    const resource = options.resource;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    const res = apiUtil
      .tags()
      .add({
        name: `${resource.toLocaleLowerCase()}`,
        description: `Managing ${resource} items`,
      })
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
          creationDate: {
            $ref: '#/components/schemas/OffsetDateTime'
          },
          creationUser: {
            type: 'string',
            readOnly: true
          },
          modificationDate: {
            $ref: '#/components/schemas/OffsetDateTime'
          },
          modificationUser: {
            type: 'string',
            readOnly: true
          },
          id: {
            type: 'string',
            readOnly: true
          },
          [COMMENT_KEY]: 'ACTION E: Add entity properties',
        },
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }

  getTitle(): string {
    return "Adapting Entity Schema in OpenAPI"
  }
}
