import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchTestsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    let htmlContent = tree.read(filePath, 'utf8');

    htmlContent = `import { PrimeIcons } from 'primeng/api';` + htmlContent;

    htmlContent = htmlContent.replace(
      "it('should dispatch export csv data on export action click'",
      `
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
        const dataTable = await dataView.getDataTable();
        const rowActionButtons = await dataTable.getActionButtons();
    
        expect(rowActionButtons.length).toBeGreaterThan(0);
        let deleteButton;
        for (const actionButton of rowActionButtons) {
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
  
      it('should export csv data on export action click'`
    );
    tree.write(filePath, htmlContent);
  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
