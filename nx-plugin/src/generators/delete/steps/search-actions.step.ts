import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchActionsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
    const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

    safeReplace(`Search Actions replace events in ${fileName}`,filePath,'events: {',
      `events: {
      'Delete ${actionName} button clicked': props<{
        id: number | string;
      }>(),
      'Delete ${actionName} cancelled': emptyProps(),
      'Delete ${actionName} succeeded': emptyProps(),
      'Delete ${actionName} failed': props<{
        error: string | null;
      }>(),
    `,tree)

  }
  getTitle(): string {
    return 'Adapting Search Actions';
  }
}
