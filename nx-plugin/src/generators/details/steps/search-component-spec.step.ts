import { Tree, names } from '@nx/devkit';

import { safeReplace } from '../../shared/safeReplace';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchComponentTestsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.spec.ts`;

    const content = tree.exists(filePath) ? tree.read(filePath, 'utf8') : '';
    if (!content.includes(`RowListGridData,`)) {
      safeReplace(
        `Add RowListGridData import to ${resourceClassName}SearchComponent spec`,
        filePath,
        [`} from '@onecx/portal-integration-angular'`],
        [` , RowListGridData } from '@onecx/portal-integration-angular';`],
        tree
      );
    }

    const snippet = `
      it('should dispatch detailsButtonClicked action on details', () => {
        jest.spyOn(store, 'dispatch');
        const row: RowListGridData = { id: 'test-id', imagePath: '' };
        component.details(row);
        expect(store.dispatch).toHaveBeenCalledWith(
          ${resourcePropertyName}SearchActions.detailsButtonClicked({ id: 'test-id' })
        );
      });
    `;

    // No variable names with $ present, only ${className} template variable to interpolate
    const snippetEscaped = snippet.replace(/\$/g, '$$$$');

    safeReplace(
      `Add details effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      [ '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      [ snippetEscaped + '  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Tests (details)';
  }
}