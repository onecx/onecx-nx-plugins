import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { PageGeneratorSchema } from '../schema';
import { updateYaml } from '../../shared/yaml';

export class GeneralPermissionsStep
  implements GeneratorStep<PageGeneratorSchema>
{
  process(tree: Tree, options: PageGeneratorSchema): void {
    const pageConstantName = names(options.pageName).constantName;
    const pagePropertyName = names(options.pageName).propertyName;

    const folderPath = 'helm/values.yaml';

    if (tree.exists(folderPath)) {
      updateYaml(tree, folderPath, (yaml) => {
        yaml['app'] ??= {};
        yaml['app']['operator'] ??= {};
        yaml['app']['operator']['permission'] ??= {};
        yaml['app']['operator']['permission']['spec'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          pageConstantName
        ] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          pageConstantName
        ]['VIEW'] ??= `View permission for ${pagePropertyName}`;
        return yaml;
      });
    }
  }
  getTitle(): string {
    return 'Adapting Permissions';
  }
}
