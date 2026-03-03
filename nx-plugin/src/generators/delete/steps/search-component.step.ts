import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.ts`;

    const find = [`} from '@onecx/portal-integration-angular';`, 'resetSearch'];
    const replaceWith = [
      `RowListGridData
    } from '@onecx/portal-integration-angular';`,
      `
    delete({ id }: RowListGridData) {
      this.store.dispatch(${propertyName}SearchActions.delete${className}ButtonClicked({ id }));
    }

    resetSearch`,
    ];

    safeReplace(
      `Add delete method to ${className}SearchComponent`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Component';
  }
}
