import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchEffectsSpecStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourcePropertyName = names(options.resource).propertyName;
    const updateResponseName = names(options.updateResponseName).className;

    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.effects.spec.ts`;
    const content = tree.read(filePath, 'utf8') ?? '';

    if (content.includes(`describe('createButtonClicked$'`)) {
      return;
    }

    if (
      !content.includes(`PortalDialogService`) ||
      !content.includes(`from '@onecx/angular-accelerator'`)
    ) {
      safeReplace(
        'Add PortalDialogService import',
        filePath,
        [/^/],
        [`import { PortalDialogService } from '@onecx/angular-accelerator';\n`],
        tree
      );
    }
    if (content.includes('providers: [') && !content.includes('PortalDialogService')) {
      safeReplace(
        'Add PortalDialogService provider',
        filePath,
        ['providers: ['],
        [
          `providers: [\n        { provide: PortalDialogService, useValue: { openDialog: jest.fn() } },`,
        ],
        tree
      );
    }
    if (!content.includes(` ${updateResponseName}`)) {
      safeReplace(
        `Add import of ${updateResponseName} to effects spec`,
        filePath,
        [`} from 'src/app/shared/generated'`],
        [`, ${updateResponseName} } from 'src/app/shared/generated'`],
        tree
      );
    }

    const specToAppend = `
      describe('refreshSearchAfterCreateUpdate$', () => {
        it('should dispatch ResultsLoadingFailed when search after create/update fails', (done) => {
          const mockError = 'Refresh search failed';
        
          store.overrideSelector(${resourcePropertyName}SearchSelectors.selectCriteria, {});
          ${resourcePropertyName}Service.search${resourceClassName}Items.mockReturnValueOnce(throwError(() => mockError));
          
          effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
            expect(action).toEqual(${resourcePropertyName}SearchActions.${resourcePropertyName}SearchResultsLoadingFailed({ error: mockError }));
            done();
          });
          
          actions$.next(${resourcePropertyName}SearchActions.create${resourceClassName}Succeeded());
        });
      });

      describe('editButtonClicked$', () => {
        const item = { id: 'test-123', name: 'Item' };
        beforeEach(() => {
          store.overrideSelector(${resourcePropertyName}SearchSelectors.selectResults, [item]);
          store.refreshState();
        });

        it('should dispatch updateSucceeded and show a success message when update succeeds', (done) => {
          const dialog = { button: 'primary', result: { ...item } };
          
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          ${resourcePropertyName}Service.update${resourceClassName}ById.mockReturnValue(of({} as HttpEvent<${updateResponseName}>));

          effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.update${resourceClassName}Succeeded.type);
            
            expect(messageService.success).toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateCancelled and not call the service when dialog is cancelled', (done) => {
          
          portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never);

          effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.update${resourceClassName}Cancelled.type);
            
            expect(${resourcePropertyName}Service.update${resourceClassName}ById).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateFailed and show an error message when API update call fails', (done) => {
          const dialog = { button: 'primary', result: { ...item } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          ${resourcePropertyName}Service.update${resourceClassName}ById.mockReturnValue(throwError(() => 'Update failed'));

          effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action).toEqual(${resourcePropertyName}SearchActions.update${resourceClassName}Failed({ error: 'Update failed' }));
            
            expect(messageService.error).toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateFailed when dialog confirms but returns no result', (done) => {  
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never);
          
          effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.update${resourceClassName}Failed.type);
            
            expect(${resourcePropertyName}Service.update${resourceClassName}ById).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.edit${resourceClassName}ButtonClicked({ id: 'test-123' }));
        });
      });

      describe('createButtonClicked$', () => {
        it('should dispatch createSucceeded and show a success message when creation succeeds', (done) => {
          const dialog = { button: 'primary', result: { name: 'New' } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          ${resourcePropertyName}Service.create${resourceClassName}.mockReturnValue(of({}) as never);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.create${resourceClassName}Succeeded.type);
            expect(messageService.success).toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked());
        });

        it('should dispatch createCancelled and not call the service when dialog is cancelled', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.create${resourceClassName}Cancelled.type);
            expect(${resourcePropertyName}Service.create${resourceClassName}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked());
        });

        it('should dispatch createFailed when dialog confirms but returns no result', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action.type).toBe(${resourcePropertyName}SearchActions.create${resourceClassName}Failed.type);
            expect(${resourcePropertyName}Service.create${resourceClassName}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked());
        });

        it('should dispatch createFailed and show an error message when API create call fails', (done) => {
          const dialog = { button: 'primary', result: { name: 'New' } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          ${resourcePropertyName}Service.create${resourceClassName}.mockReturnValue(throwError(() => 'API Error'));

          effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
            expect(action).toEqual(${resourcePropertyName}SearchActions.create${resourceClassName}Failed({ error: 'API Error' }));
            expect(messageService.error).toHaveBeenCalled();
            done();
          });

          actions$.next(${resourcePropertyName}SearchActions.create${resourceClassName}ButtonClicked());
        });
      });
    `;

    // Escape $ characters to prevent unintended template literal interpolation during string replacement
    // Variable names like 'actions$', 'effects.editButtonClicked$' need escaping to remain literal
    // Template variables like ${className} are intentionally left unescaped for proper interpolation
    const specToAppendEscaped = specToAppend.replace(/\$/g, '$$$$');

    safeReplace(
      `Add create/update effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      ['// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>'],
      [
        specToAppendEscaped +
          '\n  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>',
      ],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting Search Effects Spec (create/update)';
  }
}
