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

    const content = tree.read(filePath, 'utf8');

    // Add useAppHref import
    if (!content.includes('useAppHref')) {
    safeReplace(
      `Add useAppHref import to ${resourceClassName}SearchPage`,
      filePath,
      'from "react";',
      'from "react";\nimport { useAppHref } from "../../../../libs/react-webcomponents/src/lib/routing.utils";',
      tree
    );
    }

    // Re-read content after potential modifications
    const updatedContent = tree.read(filePath, 'utf8');

    // Add Button import after the primereact imports
    if (!updatedContent.includes('from \'primereact/button\'') && !updatedContent.includes('from "primereact/button"')) {
      safeReplace(
        `Add Button import to ${resourceClassName}SearchPage`,
        filePath,
        /from ['"]primereact\/message['"];/,
        "from 'primereact/message';\nimport { Button } from 'primereact/button';",
        tree
      );
    }

    // Add href const after useState declarations
    if (!updatedContent.includes('const { href } = useAppHref()')) {
    safeReplace(
      `Add href const to ${resourceClassName}SearchPage`,
      filePath,
      'const [searchExecuted, setSearchExecuted] = useState(false);',
      'const [searchExecuted, setSearchExecuted] = useState(false);\n  const { href } = useAppHref();',
      tree
    );
    }

    // Add details function to component
    if (!updatedContent.includes('const handleDetails = (id: string) =>')) {
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
    }

    // Add Actions column to DataTable
    if (!updatedContent.includes('pi pi-eye')) {
      const findColumns = '        ))}';
      const replaceWithColumns = `        ))}

        <Column
          header="Actions"
          body={(rowData) => (
            <Button
              icon="pi pi-eye"
              rounded
              text
              aria-label="View Details"
              onClick={() => handleDetails(rowData.id)}
            />
          )}
        />`;

      safeReplace(
        `Add Actions column to ${resourceClassName}SearchPage DataTable`,
        filePath,
        findColumns,
        replaceWithColumns,
        tree
      );
    }
  }

  getTitle(): string {
    return 'Adapting React Search Component (details)';
  }
}
