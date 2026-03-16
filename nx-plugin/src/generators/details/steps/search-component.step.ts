import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchComponentStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.ts`;

    const find = [/^/, 'resetSearch'];
    const replaceWith = [
      `import { RowListGridData } from '@onecx/portal-integration-angular';
      `,
      `
    details({id}: RowListGridData) {
      this.store.dispatch(${resourcePropertyName}SearchActions.detailsButtonClicked({id}));
    }

    resetSearch`,
    ];

    safeReplace(
      `Add details method to ${resourceClassName}SearchComponent`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Component (details)';
  }
}
