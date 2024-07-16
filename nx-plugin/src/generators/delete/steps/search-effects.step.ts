import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchEffectsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const constantName = names(options.featureName).constantName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

    let content = tree.read(filePath, 'utf8');
    content =
      `import { PortalDialogService, DialogState } from '@onecx/portal-integration-angular';` +
      `import { mergeMap } from 'rxjs';` +
      `import {
        ${options.dataObjectName},
      } from 'src/app/shared/generated';` +
      `import { PrimeIcons } from 'primeng/api';` +
      content;

    if (!content.includes('private portalDialogService: PortalDialogService')) {
      content = content.replace(
        'constructor(',
        `constructor(
        private portalDialogService: PortalDialogService,`
      );
    }

    content = content.replace(
      'searchByUrl$',
      `
      refreshSearchAfterDelete$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${className}SearchActions.delete${className}Succeeded,
          ),
          concatLatestFrom(() => this.store.select(selectSearchCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });
      
      deleteButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${className}SearchActions.delete${className}ButtonClicked),
        concatLatestFrom(() =>
          this.store.select(${propertyName}SearchSelectors.selectResults)
        ),
        map(([action, results]) => {
          return results.find((item) => item.id == action.id);
        }),
        mergeMap((itemToDelete) => {
          return this.portalDialogService.openDialog<unknown>(
            '${constantName}_DELETE.HEADER',
            '${constantName}_DELETE.MESSAGE',
            {
              key: '${constantName}_DELETE.CONFIRM',
              icon: PrimeIcons.CHECK,
            },
            {
              key: '${constantName}_DELETE.CANCEL',
              icon: PrimeIcons.TIMES,
            }
          )
          .pipe(
            map(
              (state): [DialogState<unknown>, ${options.dataObjectName} | undefined] => {
                return [state, itemToDelete];
              }
            )
          );
        }),
        switchMap(([dialogResult, itemToDelete]) => {
          if (!dialogResult || dialogResult.button == 'secondary') {
            return of(${className}SearchActions.delete${className}Cancelled());
          }
          if (!itemToDelete) {
            throw new Error('Item to delete not found!');
          }
          
          return this.${propertyName}Service
            .delete${options.dataObjectName}(itemToDelete.id)
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${constantName}_DELETE.SUCCESS',
                });
                return ${className}SearchActions.delete${className}Succeeded();
              })
            );
        }),
        catchError((error) => {
          this.messageService.error({
            summaryKey: '${constantName}_DELETE.ERROR',
          });
          return of(
            ${className}SearchActions.delete${className}Failed({
              error,
            })
          );
        })
      );
    });
  
      searchByUrl$`
    );
    tree.write(filePath, content);
  }
  getTitle(): string {
    return 'Adapting Search Effects';
  }
}
