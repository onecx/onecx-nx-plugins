import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';
import { OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { applicationNames } from '@onecx/generator-utils';

export class GeneralOpenAPIStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    if (!bffOpenApiContent) {
      return;
    }

    const { bffName } = applicationNames(options);

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    const res = apiUtil
      .servers()
      .add(`http://${bffName}:8080/`, {
        url: `http://${bffName}:8080/`,
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }
  getTitle(): string {
    return 'Adapting OpenAPI';
  }

  isApplicable(): boolean {
    return true;
  }
}
