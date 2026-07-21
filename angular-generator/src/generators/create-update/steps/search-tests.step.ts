import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchTestsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema> {
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.spec.ts`;

    const content = tree.read(filePath, 'utf8') ?? '';

    if (!content.includes(`PrimeIcons`)) {
      safeReplace(
        `Add PrimeIcons import to ${resourceClassName}SearchComponent spec`,
        filePath,
        [/^/],
        [`import { PrimeIcons } from 'primeng/api';`],
        tree
      );
    }

    if (content.includes(`edit${resourceClassName}ButtonClicked action on item edit click`)) {
      return;
    }

    const snippet = `
      it('should dispatch edit${resourceClassName}ButtonClicked action on item edit click', async () => {
        jest.spyOn(store, 'dispatch');

        store.overrideSelector(select${resourceClassName}SearchViewModel, {
          ...base${resourceClassName}SearchViewModel,
          results: [
            {
              id: '1',
              imagePath: '',
              column_1: 'val_1',
            },
          ],
          columns: [
            {
              columnType: ColumnType.STRING,
              nameKey: 'COLUMN_KEY',
              id: 'column_1',
            },
          ],
        });
        store.refreshState();

        const interactiveDataView = await ${resourcePropertyName}Search.getSearchResults();
        const dataView = await interactiveDataView.getDataView();
        const dataTable = await dataView.getDataListGrid();
        const rowActionButtons = await dataTable?.getActionButtons('list');

        if (rowActionButtons) {
          expect(rowActionButtons?.length).toBeGreaterThan(0);
          let editButton;
          for (const actionButton of rowActionButtons ?? []) {
            const icon = await actionButton.getAttribute('icon');
            expect(icon).toBeTruthy();
            if (icon === 'pi pi-pencil') {
              editButton = actionButton;
            }
          }
          expect(editButton).toBeTruthy();
          await editButton?.click();
  
          expect(store.dispatch).toHaveBeenCalledWith(
            ${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id: '1' })
          );
        }
      });

      it('should dispatch create${resourceClassName}ButtonClicked action on create click', async () => {
        jest.spyOn(store, 'dispatch');

        const header = await ${resourcePropertyName}Search.getHeader();
        const createButton = await (await header.getPageHeader()).getInlineActionButtonByLabel('Create')

        expect(createButton).toBeTruthy();
        await createButton?.click();

        expect(store.dispatch).toHaveBeenCalledWith(
          ${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked()
        );
      });
    `;

    safeReplace(
      `Add create/update effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      ['// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      [snippet + '  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting Search Tests (create/update)';
  }
}