import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';
import { toPascalCase, pluralize } from '../../shared/naming.utils';

export class SearchEffectsSpecStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const n = names(options.featureName);
    const className = n.className;
    const propertyName = n.propertyName;
    const dataObjectPascal = toPascalCase(
      (options as any).resource || className
    );
    const dataObjectPlural = pluralize(dataObjectPascal);

    const filePath = `src/app/${n.fileName}/pages/${n.fileName}-search/${n.fileName}-search.effects.spec.ts`;
    const content = tree.read(filePath, 'utf8') ?? '';

    if (
      content.includes(`describe('refreshSearchAfterDelete$'`) ||
      content.includes(`describe('deleteButtonClicked$'`)
    ) {
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
      describe('refreshSearchAfterDelete$', () => {
        it('should dispatch ResultsLoadingFailed when refresh search after delete fails', (done) => {
          const mockError = 'Refresh search after delete failed'
          store.overrideSelector(${propertyName}SearchSelectors.selectCriteria, { changeMe: 'x' } as any)
          service.search${dataObjectPlural}.mockReturnValueOnce(throwError(() => mockError) as any)
          effects.refreshSearchAfterDelete$.pipe(take(1)).subscribe((action: any) => {
            expect(action).toEqual(${className}SearchActions.${propertyName}SearchResultsLoadingFailed({ error: mockError }))
            done()
          })
          actions$.next(${className}SearchActions.delete${className}Succeeded())
        })
      })

      describe('deleteButtonClicked$', () => {
        const item = { id: 'test-123', name: 'X' } as any
        beforeEach(() => {
          store.overrideSelector(${propertyName}SearchSelectors.selectResults, [item])
          store.refreshState()
        })

        it('should delete the item and show a success message when the user confirms the dialog', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: null }) as never)
          service.delete${dataObjectPascal}.mockReturnValue(of({}) as any)
          effects.deleteButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.delete${className}Succeeded.type)
            expect(messageService.success).toHaveBeenCalled()
            expect(service.delete${dataObjectPascal}).toHaveBeenCalled()
            done()
          })
          actions$.next(${className}SearchActions.delete${className}ButtonClicked({ id: 'test-123' }))
        })

        it('should dispatch deleteCancelled and not call the service when the user cancels the dialog', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)
          effects.deleteButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action.type).toBe(${className}SearchActions.delete${className}Cancelled.type)
            expect(service.delete${dataObjectPascal}).not.toHaveBeenCalled()
            done()
          })
          actions$.next(${className}SearchActions.delete${className}ButtonClicked({ id: 'test-123' }))
        })

        it('should dispatch deleteFailed and show an error message when the API call fails', (done) => {
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: null }) as never)
          service.delete${dataObjectPascal}.mockReturnValue(throwError(() => 'Delete failed') as any)
          effects.deleteButtonClicked$.pipe(take(1)).subscribe((action: any) => {
            expect(action).toEqual(${className}SearchActions.delete${className}Failed({ error: 'Delete failed' }))
            expect(messageService.error).toHaveBeenCalled()
            done()
          })
          actions$.next(${className}SearchActions.delete${className}ButtonClicked({ id: 'test-123' }))
        })

        it('should throw an error when attempting to delete a non‑existing item', (done) => {
          store.overrideSelector(${propertyName}SearchSelectors.selectResults, [{ id: 'other' }])
          store.refreshState()
          portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: null }) as never)
          effects.deleteButtonClicked$.pipe(take(1)).subscribe({
            next: () => done.fail('Expected error'),
            error: (e: any) => {
              expect(String(e)).toContain('Item to delete not found!')
              done()
            }
          })
          actions$.next(${className}SearchActions.delete${className}ButtonClicked({ id: 'missing' as any }))
        })
      })
    `;
    // Escape $ characters to prevent unintended template literal interpolation during string replacement
    // Variable names like 'actions$', 'effects.deleteButtonClicked$' need escaping to remain literal
    // Template variables like ${className} are intentionally left unescaped for proper interpolation
    const specToAppendEscaped = specToAppend.replace(/\$/g, '$$$$');

    safeReplace(
      `Add delete effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
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
    return 'Adapting Search Effects Spec (delete)';
  }
}
