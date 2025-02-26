import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchHTMLStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    safeReplace("Search HTML Step replace <ocx-interactive-data-view", htmlSearchFilePath,'<ocx-interactive-data-view',`<ocx-interactive-data-view
      (editItem)="edit($event)"
      ${options.standalone ? '' : `editPermission="${constantName}#EDIT"`}`,tree)

  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
