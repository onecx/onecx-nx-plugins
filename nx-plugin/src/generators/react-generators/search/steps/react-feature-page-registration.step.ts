import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;

    const indexFilePath = `src/pages/${featureFileName}/index.ts`;
    const exportLine = `export { default as ${resourceClassName}SearchPage } from './${resourceFileName}-search/${resourceFileName}-search.page';`;

    if (!tree.exists(indexFilePath)) {
      tree.write(indexFilePath, `${exportLine}\n`);
      return;
    }

    const content = tree.read(indexFilePath, 'utf8');
    if (!content) {
      tree.write(indexFilePath, `${exportLine}\n`);
      return;
    }
    if (content.includes(exportLine)) {
      return;
    }

    const separator = content.endsWith('\n') ? '' : '\n';
    tree.write(indexFilePath, `${content}${separator}${exportLine}\n`);
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
