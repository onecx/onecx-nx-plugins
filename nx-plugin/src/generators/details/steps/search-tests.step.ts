import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchTestsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    const content = tree.exists(filePath) ? tree.read(filePath, 'utf8')! : '';
    if (
      !content.includes(
        `import { RowListGridData } from '@onecx/angular-accelerator';`
      )
    ) {
      safeReplace(
        `Add RowListGridData import to ${className}SearchComponent spec`,
        filePath,
        [/^/],
        [`import { RowListGridData } from '@onecx/angular-accelerator';\n`],
        tree
      );
    }

    const snippet = `
      it('should dispatch detailsButtonClicked action on details', () => {
        jest.spyOn(store, 'dispatch');
        const row: RowListGridData = { id: 'test-id', imagePath: '' } as any;
        component.details(row);
        expect(store.dispatch).toHaveBeenCalledWith(
          ${className}SearchActions.detailsButtonClicked({ id: 'test-id' })
        );
      });
    `;

    // No variable names with $ present, only ${className} template variable to interpolate
    const snippetEscaped = snippet.replace(/\$/g, '$$$$');

    safeReplace(
      `Add details effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      ['// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      [
        snippetEscaped +
          '  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>',
      ],
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
