import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchActionsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.actions.ts`;
    const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

    safeReplace(
      `Add delete button events to ${propertyName}SearchActions`,
      filePath,
      'events: {',
      `events: {
      'Delete ${actionName} button clicked': props<{ id: number | string; }>(),
      'Delete ${actionName} cancelled': emptyProps(),
      'Delete ${actionName} succeeded': emptyProps(),
      'Delete ${actionName} failed': props<{ error: string | null; }>(),
    `,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Actions';
  }
}
