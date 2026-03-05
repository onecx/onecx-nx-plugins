import { Tree, names } from '@nx/devkit';

import { safeReplace } from '../../shared/safeReplace';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchEffectsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    const propertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.effects.ts`;

    const find = [/^/, 'searchByUrl$'];

    const replaceWith = [
      `import { selectUrl } from 'src/app/shared/selectors/router.selectors';\n`,
      `navigateToOrderDetailsPage$ = createEffect(
          () => {
            return this.actions$.pipe(
              ofType(${propertyName}SearchActions.detailsButtonClicked),
              concatLatestFrom(() => this.store.select(selectUrl)),
              tap(([action, currentUrl]) => {
                const urlTree = this.router.parseUrl(currentUrl);
                urlTree.queryParams = {};
                urlTree.fragment = null;
                this.router.navigate([urlTree.toString(), 'details', action.id]);
            })
          )},
          { dispatch: false }
        );

        searchByUrl$`,
    ];

    safeReplace(
      `Add details navigation effect to ${className}SearchEffects`,
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
