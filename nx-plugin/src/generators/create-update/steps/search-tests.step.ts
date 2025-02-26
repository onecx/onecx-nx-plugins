import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchTestsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    const find = [/^/,"it('should dispatch export csv data on export action click'"];
    const replaceWith = [`import { PrimeIcons } from 'primeng/api';`,`
    it('should dispatch edit${className}ButtonClicked action on item edit click', async () => {
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
      let editButton;
      for (const actionButton of rowActionButtons ?? []) {
        const icon = await actionButton.getAttribute('ng-reflect-icon');
        expect(icon).toBeTruthy();;
        if (icon == 'pi pi-pencil') {
          editButton = actionButton;
        }
      }
      expect(editButton).toBeTruthy();
      editButton?.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.edit${className}ButtonClicked({ id: '1' })
      );
    });

    it('should dispatch create${className}ButtonClicked action on create click', async () => {
      jest.spyOn(store, 'dispatch');

      const header = await ${propertyName}Search.getHeader();
      const createButton = await (
        await header.getPageHeader()
      ).getInlineActionButtonByIcon(PrimeIcons.PLUS);

      expect(createButton).toBeTruthy();
      await createButton?.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        ${className}SearchActions.create${className}ButtonClicked()
      );
    });
    //needs to be the last test in this class
    it('should export csv data on export action click'`];
    safeReplace(`Search Tests replace in ${fileName}`,filePath, find, replaceWith, tree);
  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
