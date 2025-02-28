import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchActionsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;

    const find = 'events: {';

    const replaceWith = `events: {
      'Details button clicked': props<{
        id: number | string;
      }>(),
    `;

    safeReplace(
      `Add details button event to ${fileName}SearchActions`,
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
