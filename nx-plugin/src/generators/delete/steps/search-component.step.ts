import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    const find = [`} from '@onecx/angular-accelerator';`, 'resetSearch'];
    const replaceWith = [
      `RowListGridData
    } from '@onecx/angular-accelerator';`,
      `
    delete({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.delete${className}ButtonClicked({ id }));
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
