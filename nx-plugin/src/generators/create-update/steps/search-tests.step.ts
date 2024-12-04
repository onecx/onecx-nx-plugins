import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchTestsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.spec.ts`;

    let htmlContent = tree.read(filePath, 'utf8');

    htmlContent = `import { PrimeIcons } from 'primeng/api';` + htmlContent;

    //TODO
    // htmlContent = htmlContent.replace(
    //   "it('should dispatch export csv data on export action click'",
    //   `
    // it('should dispatch edit${className}ButtonClicked action on item edit click', async () => {
    //   jest.spyOn(store, 'dispatch');

    //   store.overrideSelector(select${className}SearchViewModel, {
    //     ...base${className}SearchViewModel,
    //     results: [
    //       {
    //         id: '1',
    //         imagePath: '',
    //         column_1: 'val_1',
    //       },
    //     ],
    //     columns: [
    //       {
    //         columnType: ColumnType.STRING,
    //         nameKey: 'COLUMN_KEY',
    //         id: 'column_1',
    //       },
    //     ],
    //   });
    //   store.refreshState();

    //   const interactiveDataView =
    //     await ${propertyName}Search.getSearchResults();
    //   const dataView = await interactiveDataView.getDataView();
    //   const dataTable = await dataView.getDataTable();
    //   const rowActionButtons = await dataTable?.getActionButtons();

    //   expect(rowActionButtons?.length).toBeGreaterThan(0);
    //   let editButton;
    //   for (const actionButton of rowActionButtons ?? []) {
    //     const icon = await actionButton.getAttribute('ng-reflect-icon');
    //     expect(icon).toBeTruthy();;
    //     if (icon == 'pi pi-pencil') {
    //       editButton = actionButton;
    //     }
    //   }
    //   expect(editButton).toBeTruthy();
    //   editButton?.click();

    //   expect(store.dispatch).toHaveBeenCalledWith(
    //     ${className}SearchActions.edit${className}ButtonClicked({ id: '1' })
    //   );
    // });

    // it('should dispatch create${className}ButtonClicked action on create click', async () => {
    //   jest.spyOn(store, 'dispatch');

    //   const header = await ${propertyName}Search.getHeader();
    //   const createButton = await (
    //     await header.getPageHeader()
    //   ).getInlineActionButtonByIcon(PrimeIcons.PLUS);

    //   expect(createButton).toBeTruthy();
    //   await createButton?.click();

    //   expect(store.dispatch).toHaveBeenCalledWith(
    //     ${className}SearchActions.create${className}ButtonClicked()
    //   );
    // });

    // //it('should export csv data on export action click'`
    // );
    tree.write(filePath, htmlContent);
  }
  getTitle(): string {
    return 'Adapting Search Tests';
  }
}
