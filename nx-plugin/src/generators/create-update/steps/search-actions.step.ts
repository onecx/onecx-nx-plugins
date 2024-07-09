import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchActionsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;
    const actionName = names(options.featureName).fileName.replaceAll('-', ' ');

    let content = tree.read(filePath, 'utf8');
    content = content.replace(
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
      `
    );
    tree.write(filePath, content);
  }
  getName(): string {
    return 'Adapting Search Tests';
  }
}
