import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchHTMLStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
    htmlContent = htmlContent.replace(
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view 
      (editItem)="edit($event)"
      ${options.standalone ? '' : `editPermission="${constantName}#EDIT"`}`
    );
    tree.write(htmlSearchFilePath, htmlContent);
  }
  getName(): string {
    return 'Adapting Search HTML';
  }
}
