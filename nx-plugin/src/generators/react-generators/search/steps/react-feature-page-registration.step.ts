import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';
import { safeReplace } from '../../../shared/safeReplace';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;

    const indexFilePath = `src/pages/${featureFileName}/index.tsx`;

    if (!tree.exists(indexFilePath)) {
      return;
    }

    const content = tree.read(indexFilePath, 'utf8');
    if (!content) {
      return;
    }

    if (!content.includes(`${resourceClassName}SearchPage`)) {
      const importLine = `import { ${resourceClassName}SearchPage } from './${resourceFileName}-search/${resourceFileName}-search.page';`;
      const updatedContent = `${importLine}\n${content}`;
      tree.write(indexFilePath, updatedContent);
    }

    safeReplace(
      'Replace feature placeholder with SearchPage',
      indexFilePath,
      [/(<div>|&lt;div&gt;)[\s\S]*?(<\/div>|&lt;\/div&gt;)/],
      [`<${resourceClassName}SearchPage />`],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
