import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchActionsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.actions.ts`;

    let htmlContent = tree.read(filePath, 'utf8');
    htmlContent = htmlContent.replace(
      'events: {',
      `events: {
        'Details button clicked': props<{
          id: number | string;
        }>(),
      `
    );
    tree.write(filePath, htmlContent);
  }
  getName(): string {
    return "Adapting Search Actions"
  }
}
