import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchComponentStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    const find = [/^/,'resetSearch'];
    const replaceWith = [
      `import {RowListGridData} from '@onecx/portal-integration-angular';\n`,
      `
    details({id}:RowListGridData) {
      this.store.dispatch(${className}SearchActions.detailsButtonClicked({id}));
    }

    resetSearch`,
    ];

    safeReplace(
      `Add import and replace 'resetSearch' in ${filePath}`,
      filePath,
      find,
      replaceWith,
      tree,
    );
  }
  getTitle(): string {
    return "Adapting Search Component"
  }
}
