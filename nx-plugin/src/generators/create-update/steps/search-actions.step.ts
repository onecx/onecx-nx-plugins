import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchActionsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
    const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

    safeReplace(
      `Add ${actionName} event handlers for create, edit, and error scenarios`,
      filePath,
      'events: {',
      `events: {
        'Create ${actionName} button clicked': emptyProps(),
        'Edit ${actionName} button clicked': props<{
          id: number | string;
        }>(),
        'Create ${actionName} cancelled': emptyProps(),
        'Update ${actionName} cancelled': emptyProps(),
        'Create ${actionName} succeeded': emptyProps(),
        'Update ${actionName} succeeded': emptyProps(),
        'Create ${actionName} failed': props<{
          error: string | null;
        }>(),
        'Update ${actionName} failed': props<{
          error: string | null;
        }>(),
      `,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Actions';
  }
}
