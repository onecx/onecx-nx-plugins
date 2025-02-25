import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchTestsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    const find = [/^/,"it('should dispatch export csv data on export action click'"];
    const replaceWith = [`import { PrimeIcons } from 'primeng/api';`, `
      it('should dispatch delete${className}ButtonClicked action on item delete click', async () => {
        jest.spyOn(store, 'dispatch');

        store.overrideSelector(select${className}SearchViewModel, {
          ...base${className}SearchViewModel,
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

        const interactiveDataView =
          await ${propertyName}Search.getSearchResults();
        const dataView = await interactiveDataView.getDataView();
        const dataTable = await dataView.getDataListGrid();
        const rowActionButtons = await dataTable?.getActionButtons('list');

        expect(rowActionButtons?.length).toBeGreaterThan(0);
        let deleteButton;
        for (const actionButton of rowActionButtons ?? []) {
          const icon = await actionButton.getAttribute('ng-reflect-icon');
          expect(icon).toBeTruthy();;
          if (icon == 'pi pi-trash') {
            deleteButton = actionButton;
          }
        }
        expect(deleteButton).toBeTruthy();
        deleteButton?.click();

        expect(store.dispatch).toHaveBeenCalledWith(
          ${className}SearchActions.delete${className}ButtonClicked({ id: '1' })
        );
      });
      //needs to be the last test in this class
      it('should export csv data on export action click'`];
    safeReplace(`SearchTests replace test in ${fileName}`,filePath, find, replaceWith, tree)

  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
