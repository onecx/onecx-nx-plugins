import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';
import { toPascalCase, pluralize } from '../../shared/naming.utils';

export class SearchEffectsSpecStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const n = names(options.featureName);
    const className = n.className;
    const propertyName = n.propertyName;

    const dataObjectPascal = toPascalCase(options.resource || className);
    const dataObjectPlural = pluralize(dataObjectPascal);

    const filePath = `src/app/${n.fileName}/pages/${n.fileName}-search/${n.fileName}-search.effects.spec.ts`;
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

    if (
      content.includes('providers: [') &&
      !content.includes('PortalDialogService')
    ) {
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

    const specToAppend = `
      describe('refreshSearchAfterCreateUpdate$', () => {
        it('should dispatch ResultsLoadingFailed when search after create/update fails', (done) => {
          const mockError = 'Refresh search failed';
        
          store.overrideSelector(${propertyName}SearchSelectors.selectCriteria, {} as any);
          service.search${dataObjectPlural}.mockReturnValueOnce(throwError(() => mockError) as any);
          
          effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action: any) => {
            expect(action).toEqual(${className}SearchActions.${propertyName}SearchResultsLoadingFailed({ error: mockError }));
            done();
          });
          
          actions$.next(${className}SearchActions.create${className}Succeeded());
        });
      });

      describe('editButtonClicked$', () => {
        const item = { id: 'test-123', name: 'Item' } as any;
        beforeEach(() => {
          store.overrideSelector(${propertyName}SearchSelectors.selectResults, [item]);
          store.refreshState();
        });

        it('should dispatch updateSucceeded and show a success message when update succeeds', (done) => {
          const dialog = { button: 'primary', result: { ...item } };
          
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          service.update${dataObjectPascal}.mockReturnValue(of({}) as any);

          effects.editButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.update${className}Succeeded.type);
            
            expect(messageService.success).toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.edit${className}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateCancelled and not call the service when dialog is cancelled', (done) => {
          
          portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never);

          effects.editButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.update${className}Cancelled.type);
            
            expect(service.update${dataObjectPascal}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.edit${className}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateFailed and show an error message when API update call fails', (done) => {
          const dialog = { button: 'primary', result: { ...item } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          service.update${dataObjectPascal}.mockReturnValue(throwError(() => 'Update failed') as any);

          effects.editButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action).toEqual(${className}SearchActions.update${className}Failed({ error: 'Update failed' }));
            
            expect(messageService.error).toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.edit${className}ButtonClicked({ id: 'test-123' }));
        });

        it('should dispatch updateFailed when dialog confirms but returns no result', (done) => {  
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never);
          
          effects.editButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.update${className}Failed.type);
            
            expect(service.update${dataObjectPascal}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.edit${className}ButtonClicked({ id: 'test-123' }));
        });
      });

      describe('createButtonClicked$', () => {
        it('should dispatch createSucceeded and show a success message when creation succeeds', (done) => {
          const dialog = { button: 'primary', result: { name: 'New' } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          service.create${dataObjectPascal}.mockReturnValue(of({}) as any);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.create${className}Succeeded.type);
            expect(messageService.success).toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.create${className}ButtonClicked());
        });

        it('should dispatch createCancelled and not call the service when dialog is cancelled', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.create${className}Cancelled.type);
            expect(service.create${dataObjectPascal}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.create${className}ButtonClicked());
        });

        it('should dispatch createFailed when dialog confirms but returns no result', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.create${className}Failed.type);
            expect(service.create${dataObjectPascal}).not.toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.create${className}ButtonClicked());
        });

        it('should dispatch createFailed and show an error message when API create call fails', (done) => {
          const dialog = { button: 'primary', result: { name: 'New' } };
          portalDialogService.openDialog.mockReturnValue(of(dialog) as never);
          service.create${dataObjectPascal}.mockReturnValue(throwError(() => 'API Error') as any);

          effects.createButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action).toEqual(${className}SearchActions.create${className}Failed({ error: 'API Error' }));
            expect(messageService.error).toHaveBeenCalled();
            done();
          });

          actions$.next(${className}SearchActions.create${className}ButtonClicked());
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
