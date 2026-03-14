import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class SearchEffectsStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const resourceConstantName = names(options.resource).constantName;
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
            ${resourcePropertyName}SearchActions.delete${resourceClassName}Succeeded,
          ),
          concatLatestFrom(() => this.store.select(${resourcePropertyName}SearchSelectors.selectCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });

      deleteButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${resourcePropertyName}SearchActions.delete${resourceClassName}ButtonClicked),
        concatLatestFrom(() =>
          this.store.select(${resourcePropertyName}SearchSelectors.selectResults)
        ),
        map(([action, results]) => {
          return results.find((item) => item.id == action.id);
        }),
        mergeMap((itemToDelete) => {
          return this.portalDialogService.openDialog<unknown>(
            '${resourceConstantName}_DELETE.HEADER',
            '${resourceConstantName}_DELETE.MESSAGE',
            {
              key: '${resourceConstantName}_DELETE.CONFIRM',
              icon: PrimeIcons.CHECK,
            },
            {
              key: '${resourceConstantName}_DELETE.CANCEL',
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
            return of(${resourcePropertyName}SearchActions.delete${resourceClassName}Cancelled());
          }
          if (!itemToDelete) {
            throw new Error('Item to delete not found!');
          }

          return this.${resourcePropertyName}Service
            .delete${resourceClassName}ById({ id: itemToDelete.id })
            .pipe(
              map(() => {
                this.messageService.success({ summaryKey: '${resourceConstantName}_DELETE.SUCCESS' });
                return ${resourcePropertyName}SearchActions.delete${resourceClassName}Succeeded();
              }),
              catchError((error) => {
                this.messageService.error({ summaryKey: '${resourceConstantName}_DELETE.ERROR' });
                return of(
                  ${resourcePropertyName}SearchActions.delete${resourceClassName}Failed({ error })
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
      `Modify ${resourceClassName}SearchEffects to include delete effects`,
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
