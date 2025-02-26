import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchHTMLStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    safeReplace(`SearchHTML replace ocx-interactive-data-view in ${fileName}`,htmlSearchFilePath,'<ocx-interactive-data-view',`<ocx-interactive-data-view
      (deleteItem)="delete($event)"
      ${options.standalone ? '' : `deletePermission="${constantName}#DELETE"`}`,tree)

  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
