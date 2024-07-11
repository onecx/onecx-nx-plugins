import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchActionsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
    const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

    let content = tree.read(filePath, 'utf8');
    content = content.replace(
      'events: {',
      `events: {      
      'Delete ${actionName} button clicked': props<{
        id: number | string;
      }>(),
      'Delete ${actionName} cancelled': emptyProps(),
      'Delete ${actionName} succeeded': emptyProps(),      
      'Delete ${actionName} failed': props<{
        error: string | null;
      }>(),
    `
    );
    tree.write(filePath, content);
  }
  getName(): string {
    return 'Adapting Search Actions';
  }
}
