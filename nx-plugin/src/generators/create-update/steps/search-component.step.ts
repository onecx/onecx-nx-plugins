import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourceConstantName = names(options.resource).constantName;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.ts`;

    const find = [
      `} from '@onecx/angular-accelerator';`,
      'const actions: Action[] = [',
      'resetSearch',
    ];
    const replaceWith = [
      `RowListGridData
      } from '@onecx/angular-accelerator';`,
      `const actions: Action[] = [
      {
       labelKey: '${resourceConstantName}_CREATE_UPDATE.ACTION.CREATE',
       icon: PrimeIcons.PLUS,
       show: 'always',
       actionCallback: () => this.create(),
      },`,
      `
      create() {
        this.store.dispatch(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked());
      }

      edit({ id }: RowListGridData) {
        this.store.dispatch(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id }));
      }

      resetSearch`,
    ];
    safeReplace(
      `Modify ${resourceClassName}SearchComponent to implement create and edit actions, extend the actions array with a new create button, and update import statements to include RowListGridData`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Component (create/update)';
  }
}
