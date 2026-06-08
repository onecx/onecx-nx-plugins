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

    // Add useAppHref import
    safeReplace(
      `Add useAppHref import to ${resourceClassName}SearchPage`,
      filePath,
      'from "react";',
      'from "react";\nimport { useAppHref } from "../../../../libs/react-webcomponents/src/lib/routing.utils";',
      tree
    );

    // Add href const after useState declarations
    safeReplace(
      `Add href const to ${resourceClassName}SearchPage`,
      filePath,
      'const [searchExecuted, setSearchExecuted] = useState(false);',
      'const [searchExecuted, setSearchExecuted] = useState(false);\n  const { href } = useAppHref();',
      tree
    );

    // Add details function to component
    const findMethod = 'const handleReset = () => {';
    const replaceWithMethod = `const handleDetails = (id: string) => {
      window.location.href = \`\${href}/${featureFileName}/\${id}\`;
    };

    const handleReset = () => {`;

    safeReplace(
      `Add details function to ${resourceClassName}SearchPage`,
      filePath,
      findMethod,
      replaceWithMethod,
      tree
    );

    // Add onRowClick to DataTable in JSX
    const findTemplate = '<DataTable';
    const replaceWithTemplate = `<DataTable
        onRowClick={(e) => {
          if (e.data?.id) {
            handleDetails(e.data.id);
          }
        }}`;

    safeReplace(
      `Add onRowClick event to ${resourceClassName}SearchPage DataTable`,
      filePath,
      findTemplate,
      replaceWithTemplate,
      tree
    );
  }

  getTitle(): string {
    return 'Adapting React Search Component (details)';
  }
}
