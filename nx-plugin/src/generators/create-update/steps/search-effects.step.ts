import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchEffectsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const propertyName = names(options.featureName).propertyName;
    const constantName = names(options.featureName).constantName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

    const find = [/^/, 'searchByUrl$'];
    const replaceWith = [
      `import { PortalDialogService } from '@onecx/portal-integration-angular';` +
        `import { mergeMap } from 'rxjs';` +
        `import {
        ${options.dataObjectName},
        ${options.createRequestName},
        ${options.updateRequestName},
      } from 'src/app/shared/generated';` +
        `import { ${className}CreateUpdateComponent } from './dialogs/${options.featureName}-create-update/${options.featureName}-create-update.component';`,
      `
      refreshSearchAfterCreateUpdate$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${className}SearchActions.create${className}Succeeded,
            ${className}SearchActions.update${className}Succeeded
          ),
          concatLatestFrom(() => this.store.select(${propertyName}SearchSelectors.selectCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });

      editButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${className}SearchActions.edit${className}ButtonClicked),
        concatLatestFrom(() =>
          this.store.select(${propertyName}SearchSelectors.selectResults)
        ),
        map(([action, results]) => {
          return results.find((item) => item.id == action.id);
        }),
        mergeMap((itemToEdit) => {
          return this.portalDialogService.openDialog< ${options.dataObjectName} | undefined>(
            '${constantName}_CREATE_UPDATE.UPDATE.HEADER',
            {
              type: ${className}CreateUpdateComponent,
              inputs: {
                vm: {
                  itemToEdit,
                }
              },
            },
            '${constantName}_CREATE_UPDATE.UPDATE.FORM.SAVE',
            '${constantName}_CREATE_UPDATE.UPDATE.FORM.CANCEL', {
              baseZIndex: 100
            }
          );
        }),
        switchMap((dialogResult) => {
          if (!dialogResult || dialogResult.button == 'secondary') {
            return of(${className}SearchActions.update${className}Cancelled());
          }
          if (!dialogResult?.result) {
            throw new Error('DialogResult was not set as expected!');
          }
          const itemToEditId = dialogResult.result.id;
          const itemToEdit = {
              resource: dialogResult.result
          } as ${options.updateRequestName};
          return this.${propertyName}Service
            .update${options.dataObjectName}(itemToEditId, itemToEdit)
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.SUCCESS',
                });
                return ${className}SearchActions.update${className}Succeeded();
              })
            );
        }),
        catchError((error) => {
          this.messageService.error({
            summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.ERROR',
          });
          return of(
            ${className}SearchActions.update${className}Failed({
              error,
            })
          );
        })
      );
    });

    createButtonClicked$ = createEffect(
      () => {
        return this.actions$.pipe(
          ofType(${className}SearchActions.create${className}ButtonClicked),
          switchMap(() => {
            return this.portalDialogService.openDialog< ${options.dataObjectName} | undefined>(
              '${constantName}_CREATE_UPDATE.CREATE.HEADER',
              {
                type: ${className}CreateUpdateComponent,
                inputs: {
                  vm: {
                    itemToEdit: {},
                  }
                },
              },
              '${constantName}_CREATE_UPDATE.CREATE.FORM.SAVE',
              '${constantName}_CREATE_UPDATE.CREATE.FORM.CANCEL', {
                baseZIndex: 100
              }
            );
          }),
          switchMap((dialogResult) => {
            if (!dialogResult || dialogResult.button == 'secondary') {
              return of(${className}SearchActions.create${className}Cancelled());
            }
            if (!dialogResult?.result) {
              throw new Error('DialogResult was not set as expected!');
            }
            const toCreateItem = {
              resource: dialogResult.result
            } as ${options.createRequestName};
            return this.${propertyName}Service
              .create${options.dataObjectName}(toCreateItem)
              .pipe(
                map(() => {
                  this.messageService.success({
                    summaryKey: '${constantName}_CREATE_UPDATE.CREATE.SUCCESS',
                  });
                  return ${className}SearchActions.create${className}Succeeded();
                })
              );
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: '${constantName}_CREATE_UPDATE.CREATE.ERROR',
            });
            return of(
              ${className}SearchActions.create${className}Failed({
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
    if (!content.includes('private portalDialogService: PortalDialogService')) {
      find.push('constructor(');
      replaceWith.push(`constructor(
          private portalDialogService: PortalDialogService,`);
    }
    safeReplace(
      `Enhance ${className}SearchEffects by adding create and edit effects, integrating PortalDialogService for dialog management, and updating imports to include necessary modules and services`,
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
