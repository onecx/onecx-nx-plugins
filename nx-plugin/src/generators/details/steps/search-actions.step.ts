import { Tree, names } from '@nx/devkit';

import { safeReplace } from '../../shared/safeReplace';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchActionsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.actions.ts`;

    const find = 'events: {';

    const replaceWith = `events: {
      'Details button clicked': props<{
        id: number | string;
      }>(),
    `;

    safeReplace(
      `Add details button event to ${propertyName}SearchActions`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Actions';
  }
}
