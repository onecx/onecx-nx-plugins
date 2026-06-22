import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../../shared/generator.utils';
import { safeReplace } from '../../../shared/safeReplace';
import { ReactPageGeneratorSchema } from '../schema';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const pageFileName = names(options.pageName).fileName;
    const pageClassName = names(options.pageName).className;

    const indexFilePath = `src/pages/${featureFileName}/index.tsx`;

    if (!tree.exists(indexFilePath)) {
      return;
    }

    const content = tree.read(indexFilePath, 'utf8');
    if (!content) {
      return;
    }

    if (!content.includes(`${pageClassName}Page`)) {
      const importLine = `import { ${pageClassName}Page } from './${pageFileName}/${pageFileName}.page';`;
      const updatedContent = `${importLine}\n${content}`;
      tree.write(indexFilePath, updatedContent);
    }

    safeReplace(
      'Replace feature placeholder with Page',
      indexFilePath,
      [/(<div>|&lt;div&gt;)[\s\S]*?(<\/div>|&lt;\/div&gt;)/],
      [`<${pageClassName}Page />`],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
