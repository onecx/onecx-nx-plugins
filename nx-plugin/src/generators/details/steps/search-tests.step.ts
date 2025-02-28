import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchTestsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    safeReplace(
      `Add details button test to ${className}SearchComponent`,
      filePath,
      "it('should export csv data on export action click'",
      `
    it('should dispatch detailsButtonClicked action on item details click', async () => {
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
      const rowActionButtons = await dataTable?.getActionButtons();

      expect(rowActionButtons?.length).toEqual(1);
      expect(await rowActionButtons?.at(0)?.getAttribute('ng-reflect-icon')).toEqual(
        'pi pi-eye'
      );
      await rowActionButtons?.at(0)?.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.detailsButtonClicked({ id: '1' })
      );
    });

    it('should export csv data on export action click'`,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
