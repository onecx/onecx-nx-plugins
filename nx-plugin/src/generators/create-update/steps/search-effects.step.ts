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
    const className = names(options.resource).className;
    const constantName = names(options.resource).constantName;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.effects.ts`;

    const find = [/^/, 'searchByUrl$'];
    const replaceWith = [
      `import { PortalDialogService } from '@onecx/portal-integration-angular';` +
        `import { mergeMap } from 'rxjs';` +
        `import {
        ${options.resource},
        ${options.createRequestName},
        ${options.updateRequestName},
      } from 'src/app/shared/generated';` +
        `import { ${className}CreateUpdateComponent } from './dialogs/${resourceFileName}-create-update/${resourceFileName}-create-update.component';`,
      `
      refreshSearchAfterCreateUpdate$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(
            ${propertyName}SearchActions.create${className}Succeeded,
            ${propertyName}SearchActions.update${className}Succeeded
          ),
          concatLatestFrom(() => this.store.select(${propertyName}SearchSelectors.selectCriteria)),
          switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
        );
      });

      editButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(${propertyName}SearchActions.edit${className}ButtonClicked),
        concatLatestFrom(() =>
          this.store.select(${propertyName}SearchSelectors.selectResults)
        ),
        map(([action, results]) => {
          return results.find((item) => item.id == action.id);
        }),
        mergeMap((itemToEdit) => {
          return this.portalDialogService.openDialog< ${options.resource} | undefined>(
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
            return of(${propertyName}SearchActions.update${className}Cancelled());
          }
          if (!dialogResult?.result) {
            throw new Error('DialogResult was not set as expected!');
          }
          const itemToEditId = dialogResult.result.id;
          const itemToEdit = {
              dataObject: dialogResult.result
          } as ${options.updateRequestName};
          return this.${propertyName}Service
            .update${options.resource}(itemToEditId, itemToEdit)
            .pipe(
              map(() => {
                this.messageService.success({
                  summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.SUCCESS',
                });
                return ${propertyName}SearchActions.update${className}Succeeded();
              })
            );
        }),
        catchError((error) => {
          this.messageService.error({
            summaryKey: '${constantName}_CREATE_UPDATE.UPDATE.ERROR',
          });
          return of(
            ${propertyName}SearchActions.update${className}Failed({
              error,
            })
          );
        })
      );
    });

    createButtonClicked$ = createEffect(
      () => {
        return this.actions$.pipe(
          ofType(${propertyName}SearchActions.create${className}ButtonClicked),
          switchMap(() => {
            return this.portalDialogService.openDialog< ${options.resource} | undefined>(
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
              return of(${propertyName}SearchActions.create${className}Cancelled());
            }
            if (!dialogResult?.result) {
              throw new Error('DialogResult was not set as expected!');
            }
            const toCreateItem = {
              dataObject: dialogResult.result
            } as ${options.createRequestName};
            return this.${propertyName}Service
              .create${options.resource}(toCreateItem)
              .pipe(
                map(() => {
                  this.messageService.success({
                    summaryKey: '${constantName}_CREATE_UPDATE.CREATE.SUCCESS',
                  });
                  return ${propertyName}SearchActions.create${className}Succeeded();
                })
              );
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: '${constantName}_CREATE_UPDATE.CREATE.ERROR',
            });
            return of(
              ${propertyName}SearchActions.create${className}Failed({
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
