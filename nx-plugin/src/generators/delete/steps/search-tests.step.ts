import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchTestsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.spec.ts`;

    const content = tree.exists(filePath) ? tree.read(filePath, 'utf8') : '';
    if (!content.includes(`import { RowListGridData } from '@onecx/portal-integration-angular'`)) {
      safeReplace(
        `Add RowListGridData import to ${className}SearchComponent spec`,
        filePath,
        [/^/],
        [`import { RowListGridData } from '@onecx/portal-integration-angular';\n`],
        tree
      );
    }

    const snippet = `
      it('should dispatch delete${className}ButtonClicked on delete(row)', () => {
        jest.spyOn(store, 'dispatch');
        const row = { id: '1' } as any;
        component.delete(row);
        expect(store.dispatch).toHaveBeenCalledWith(
          ${propertyName}SearchActions.delete${className}ButtonClicked({ id: '1' })
        );
      });
    `;

    safeReplace(
      `Add details effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      [ '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      [ snippet + '  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting Search Tests (delete)';
  }
}
