import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchEffectsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourceConstantName = names(options.resource).constantName;
    const resourcePropertyName = names(options.resource).propertyName;
    const createRequestPropertyName = names(options.createRequestName).propertyName;
    const updateRequestPropertyName = names(options.updateRequestName).propertyName;

    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.effects.ts`;

    const find = [/^/, 'searchByUrl$'];
    const replaceWith = [
      `import { PortalDialogService } from '@onecx/angular-accelerator';` +
        `import { mergeMap } from 'rxjs';` +
        `import {
        ${resourceClassName},
        ${options.createRequestName},
        ${options.updateRequestName},
      } from 'src/app/shared/generated';` +
        `import { ${resourceClassName}CreateUpdateComponent } from './dialogs/${resourceFileName}-create-update/${resourceFileName}-create-update.component';`,
      `
      refreshSearchAfterCreateUpdate$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${resourcePropertyName}SearchActions.create${resourceClassName}Succeeded,
            ${resourcePropertyName}SearchActions.update${resourceClassName}Succeeded
          ),
          concatLatestFrom(() => this.store.select(${resourcePropertyName}SearchSelectors.selectCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });

      editButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked),
        concatLatestFrom(() =>
          this.store.select(${resourcePropertyName}SearchSelectors.selectResults)
        ),
        map(([action, results]) => {
          return results.find((item) => item.id == action.id);
        }),
        mergeMap((itemToEdit) => {
          return this.portalDialogService.openDialog< ${resourceClassName} | undefined>(
            '${resourceConstantName}_CREATE_UPDATE.UPDATE.HEADER',
            {
              type: ${resourceClassName}CreateUpdateComponent,
              inputs: {
                vm: {
                  itemToEdit,
                }
              },
            },
            '${resourceConstantName}_CREATE_UPDATE.UPDATE.FORM.SAVE',
            '${resourceConstantName}_CREATE_UPDATE.UPDATE.FORM.CANCEL', {
              baseZIndex: 100
            }
          );
        }),
        switchMap((dialogResult) => {
          if (!dialogResult || dialogResult.button == 'secondary') {
            return of(${resourcePropertyName}SearchActions.update${resourceClassName}Cancelled());
          }
          if (!dialogResult?.result) {
            throw new Error('DialogResult was not set as expected!');
          }
          const itemToEditId = dialogResult.result.id;
          const itemToEdit = {
              dataObject: dialogResult.result
          } as ${options.updateRequestName};
          return this.${resourcePropertyName}Service
            .update${resourceClassName}ById({id: itemToEditId, ${updateRequestPropertyName}: itemToEdit})
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${resourceConstantName}_CREATE_UPDATE.UPDATE.SUCCESS',
                });
                return ${resourcePropertyName}SearchActions.update${resourceClassName}Succeeded();
              })
            );
        }),
        catchError((error) => {
          this.messageService.error({
            summaryKey: '${resourceConstantName}_CREATE_UPDATE.UPDATE.ERROR',
          });
          return of(
            ${resourcePropertyName}SearchActions.update${resourceClassName}Failed({
              error,
            })
          );
        })
      );
    });

    createButtonClicked$ = createEffect(
      () => {
        return this.actions$.pipe(
          ofType(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked),
          switchMap(() => {
            return this.portalDialogService.openDialog< ${resourceClassName} | undefined>(
              '${resourceConstantName}_CREATE_UPDATE.CREATE.HEADER',
              {
                type: ${resourceClassName}CreateUpdateComponent,
                inputs: {
                  vm: {
                    itemToEdit: {},
                  }
                },
              },
              '${resourceConstantName}_CREATE_UPDATE.CREATE.FORM.SAVE',
              '${resourceConstantName}_CREATE_UPDATE.CREATE.FORM.CANCEL', {
                baseZIndex: 100
              }
            );
          }),
          switchMap((dialogResult) => {
            if (!dialogResult || dialogResult.button == 'secondary') {
              return of(${resourcePropertyName}SearchActions.create${resourceClassName}Cancelled());
            }
            if (!dialogResult?.result) {
              throw new Error('DialogResult was not set as expected!');
            }
            const toCreateItem = {
              dataObject: dialogResult.result
            } as ${options.createRequestName};
            return this.${resourcePropertyName}Service
              .create${resourceClassName}({${createRequestPropertyName}: toCreateItem})
              .pipe(
                map(() => {
                  this.messageService.success({
                    summaryKey: '${resourceConstantName}_CREATE_UPDATE.CREATE.SUCCESS',
                  });
                  return ${resourcePropertyName}SearchActions.create${resourceClassName}Succeeded();
                })
              );
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: '${resourceConstantName}_CREATE_UPDATE.CREATE.ERROR',
            });
            return of(
              ${resourcePropertyName}SearchActions.create${resourceClassName}Failed({
                error,
              })
            );
          })
        );
      }
    );

      searchByUrl$`,
    ];
    const content = tree.read(filePath, 'utf8');
    if (
      !content.includes(
        'private readonly portalDialogService = inject(PortalDialogService)'
      )
    ) {
      find.push('private readonly actions$ = inject(Actions)');
      replaceWith.push(`
        private readonly actions$ = inject(Actions)
        private readonly portalDialogService = inject(PortalDialogService)
      `);
    }
    safeReplace(
      `Enhance ${resourceClassName}SearchEffects by adding create and edit effects, integrating PortalDialogService for dialog management, and updating imports to include necessary modules and services`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search Effects (create/update)';
  }
}
