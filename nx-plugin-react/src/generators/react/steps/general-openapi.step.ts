import { Tree, joinPathFragments } from '@nx/devkit';
import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';
import { OpenAPIUtil } from '../../shared/openapi/openapi.utils';

export class GeneralOpenAPIStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    const bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    if (!bffOpenApiContent) {
      throw new GeneratorStepError(
        `OpenAPI file not found at ${openApiFolderPath}/${bffOpenApiPath} – skipping OpenAPI step.`
      );
    }

    const resource = options.name;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    const res = apiUtil
      .servers()
      .add(`http://onecx-${resource.toLocaleLowerCase()}-bff:8080/`, {
        url: `http://onecx-${resource.toLocaleLowerCase()}-bff:8080/`,
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }
  getTitle(): string {
    return 'Adapting OpenAPI';
  }
}
