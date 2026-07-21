import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchHTMLStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourceConstantName = names(options.resource).constantName;
    const htmlSearchFilePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.html`;

    safeReplace(
      `Add edit event and permissions to <ocx-interactive-data-view> in ${resourceClassName}SearchComponent`,
      htmlSearchFilePath,
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view
      (editItem)="edit($event)"
      ${options.standalone ? '' : `editPermission="${resourceConstantName}#EDIT"`}`,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search HTML (create/update)';
  }
}
