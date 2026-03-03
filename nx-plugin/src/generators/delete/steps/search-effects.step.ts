import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchEffectsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    const propertyName = names(options.resource).propertyName;
    const constantName = names(options.resource).constantName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.effects.ts`;

    const find = [/^/, 'searchByUrl$'];
    const replaceWith = [
      `import { PortalDialogService, DialogState } from '@onecx/portal-integration-angular';` +
        `import { mergeMap } from 'rxjs';` +
        `import {
        ${options.resource},
      } from 'src/app/shared/generated';` +
        `import { PrimeIcons } from 'primeng/api';`,
      `
      refreshSearchAfterDelete$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${propertyName}SearchActions.delete${className}Succeeded,
          ),
          concatLatestFrom(() => this.store.select(${propertyName}SearchSelectors.selectCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });

      deleteButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${propertyName}SearchActions.delete${className}ButtonClicked),
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
              (state): [DialogState<unknown>, ${options.resource} | undefined] => {
                return [state, itemToDelete];
              }
            )
          );
        }),
        switchMap(([dialogResult, itemToDelete]) => {
          if (!dialogResult || dialogResult.button == 'secondary') {
            return of(${propertyName}SearchActions.delete${className}Cancelled());
          }
          if (!itemToDelete) {
            throw new Error('Item to delete not found!');
          }

          return this.${propertyName}Service
            .delete${className}(itemToDelete.id)
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${constantName}_DELETE.SUCCESS',
                });
                return ${propertyName}SearchActions.delete${className}Succeeded();
              }),
              catchError((error) => {
                this.messageService.error({
                  summaryKey: '${constantName}_DELETE.ERROR',
                });
                return of(
                  ${propertyName}SearchActions.delete${className}Failed({
                    error,
                  })
                );
              })
            );
        })
      );
    });

      searchByUrl$`,
    ];
    const content = tree.read(filePath, 'utf8');
    if (!content.includes('private portalDialogService: PortalDialogService')) {
      find.push('constructor(');
      replaceWith.push(`constructor(
          private portalDialogService: PortalDialogService,`);
    }
    safeReplace(
      `Modify ${className}SearchEffects to include delete effects`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Effects';
  }
}
