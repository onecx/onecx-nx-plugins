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

    const contentToReplace= [`} from '@onecx/portal-integration-angular';`,'resetSearch'];
    const replaceWith= [`RowListGridData
    } from '@onecx/portal-integration-angular';`,`
    delete({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.delete${className}ButtonClicked({ id }));
    }

    resetSearch`];

    safeReplace(`Search Component replace imports and resetSearch in ${fileName}`,filePath,contentToReplace,replaceWith,tree)

  }
  getTitle(): string {
    return 'Adapting Search Component';
  }
}
