import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../../shared/generator.utils';
import { safeReplace } from '../../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class ReactSearchComponentStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const filePath = `src/pages/${featureFileName}/${resourceFileName}-search/${resourceFileName}-search.page.tsx`;

    if (!tree.exists(filePath)) {
      return;
    }

    // Add useNavigate import
    if (!tree.read(filePath, 'utf8')?.includes('useNavigate')) {
      safeReplace(
        `Add useNavigate import to ${resourceClassName}SearchPage`,
        filePath,
        'import { useTranslation } from "react-i18next";',
        'import { useTranslation } from "react-i18next";\nimport { useNavigate } from "react-router";',
        tree
      );
    }

    // Add navigate const after the useTranslation hook
    if (
      !tree.read(filePath, 'utf8')?.includes('const navigate = useNavigate()')
    ) {
      safeReplace(
        `Add navigate const to ${resourceClassName}SearchPage`,
        filePath,
        'const { t } = useTranslation();',
        'const { t } = useTranslation();\n  const navigate = useNavigate();',
        tree
      );
    }

    // Add the view handler that navigates to the details page
    if (!tree.read(filePath, 'utf8')?.includes('const handleViewItem =')) {
      const findMethod = 'const handleReset = () => {';
      const replaceWithMethod = `const handleViewItem = (item: ${resourceClassName}SearchRow) => {
    navigate(\`./\${item.id}\`);
  };

  const handleReset = () => {`;

      safeReplace(
        `Add view handler to ${resourceClassName}SearchPage`,
        filePath,
        findMethod,
        replaceWithMethod,
        tree
      );
    }

    // Wire the view handler into the results section
    if (!tree.read(filePath, 'utf8')?.includes('onViewItem={handleViewItem}')) {
      safeReplace(
        `Add onViewItem prop to ${resourceClassName}SearchResultsSection`,
        filePath,
        'results={results}',
        'onViewItem={handleViewItem}\n            results={results}',
        tree
      );
    }
  }

  getTitle(): string {
    return 'Adapting React Search Component (details)';
  }
}
