import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';
import { updateYaml } from '../../shared/yaml';

export class GeneralPermissionsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const constantName = names(options.featureName).constantName;
    const propertyName = names(options.featureName).propertyName;

    const folderPath = 'helm/values.yaml';

    if (tree.exists(folderPath)) {
      updateYaml(tree, folderPath, (yaml) => {
        yaml['app'] ??= {};
        yaml['app']['operator'] ??= {};
        yaml['app']['operator']['permission'] ??= {};
        yaml['app']['operator']['permission']['spec'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['CREATE'] ??= `Create ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['EDIT'] ??= `Edit ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['DELETE'] ??= `Delete ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['SAVE'] ??= `Update and save ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['IMPORT'] ??= `Import ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['EXPORT'] ??= `Export ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['VIEW'] ??= `View mode for ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['SEARCH'] ??= `Search ${propertyName}`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['BACK'] ??= `Navigate back in details of ${propertyName}`;
        return yaml;
      });
    }
  }
  getTitle(): string {
    return "Adapting Permissions"
  }
}
