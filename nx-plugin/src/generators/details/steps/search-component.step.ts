import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchComponentStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    let htmlContent = tree.read(filePath, 'utf8');
    htmlContent =
      `import {RowListGridData} from '@onecx/portal-integration-angular';` +
      htmlContent.replace(
        'resetSearch',
        `
    details({id}:RowListGridData) {
      this.store.dispatch(${className}SearchActions.detailsButtonClicked({id}));
    }

    resetSearch`
      );
    tree.write(filePath, htmlContent);
  }
  getTitle(): string {
    return "Adapting Search Component"
  }
}
