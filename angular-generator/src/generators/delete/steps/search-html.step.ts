import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchHTMLStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const constantName = names(options.resource).constantName;
    const htmlSearchFilePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.html`;

    safeReplace(
      `Modify ${resourceClassName}SearchComponent HTML to include delete event`,
      htmlSearchFilePath,
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view
      (deleteItem)="delete($event)"
      ${options.standalone ? '' : `deletePermission="${constantName}#DELETE"`}`,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
