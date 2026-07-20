import { Tree, names } from '@nx/devkit';

import { safeReplace } from '../../shared/safeReplace';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchTestsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.spec.ts`;

    const content = tree.exists(filePath) ? tree.read(filePath, 'utf8') : '';
    if (!content.includes(`import { RowListGridData } from '@onecx/angular-accelerator'`)) {
      safeReplace(
        `Add RowListGridData import to ${resourceClassName}SearchComponent spec`,
        filePath,
        [/^/],
        [`import { RowListGridData } from '@onecx/angular-accelerator';`],
        tree
      );
    }

    const snippet = `
      it('should dispatch delete${resourceClassName}ButtonClicked on delete(row)', () => {
        jest.spyOn(store, 'dispatch');
        const row = { id: '1' } as any;
        component.delete(row);
        expect(store.dispatch).toHaveBeenCalledWith(
          ${resourcePropertyName}SearchActions.delete${resourceClassName}ButtonClicked({ id: '1' })
        );
      });
    `;

    safeReplace(
      `Add details effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      ['// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      [snippet + '  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting Search Tests (delete)';
  }
}
