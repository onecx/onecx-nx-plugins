import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchEffectsSpecStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const className = names(options.featureName).className;
    const filePath = `src/app/${names(options.featureName).fileName}/pages/${names(options.featureName).fileName}-search/${names(options.featureName).fileName}-search.effects.spec.ts`;

    const specToAppend = `
      describe('detailsButtonClicked$', () => {

        it('should navigate to details page with correct URL structure', (done) => {
          const testId = 'test-123';
          const navigateSpy = router ? jest.spyOn(router, 'navigate') : { mock: { calls: [] }, toHaveBeenCalledWith: () => {} };

          effects.detailsButtonClicked$.pipe(take(1)).subscribe(() => {
            if (router) {
              expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId]);
            }
            done();
          });

          actions$.next(${className}SearchActions.detailsButtonClicked({ id: testId }));
        });

        it('should dynamically clear query params and fragment from URL on detailsButtonClicked$', (done) => {
          const testId = 'test-456';
          const mockUrlTree: any = { 
            toString: jest.fn(() => '/search'), 
            queryParams: { a: 1 }, 
            fragment: 'frag' 
          };
          (router.parseUrl as jest.Mock).mockReturnValue(mockUrlTree);

          const emissions: Array<{ queryParams: any, fragment: any }> = [];
          emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment });

          effects.detailsButtonClicked$.pipe(take(1)).subscribe(() => {
            emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment });

            expect(emissions).toEqual([
              { queryParams: { a: 1 }, fragment: 'frag' },
              { queryParams: {}, fragment: null }
            ]);
            done();
          });

          actions$.next(${className}SearchActions.detailsButtonClicked({ id: testId }));
        });
      });
    `;

    // Escape $ characters to prevent template literal interpolation during string replacement
    // Each $ becomes $$$$ so ${variable} becomes literal ${variable} in the output file
    const specToAppendEscaped = specToAppend.replace(/\$/g, '$$$$');

    safeReplace(
      `Add details effect tests to search effects spec file. Look for the marker comment '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' in ${filePath} and insert the test code above it.`,
      filePath,
      [ '// <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      [ specToAppendEscaped + '\n  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>' ],
      tree
    );
  }

  getTitle(): string {
    return 'Adapting Search Effects Spec (details)';
  }
}