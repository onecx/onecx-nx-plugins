import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchEffectsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

    const find = [/^/,'searchByUrl$']

    const replaceWith = [
      `import { selectUrl } from 'src/app/shared/selectors/router.selectors';\n`,
      `detailsButtonClicked$ = createEffect(
          () => {
            return this.actions$.pipe(
              ofType(${className}SearchActions.detailsButtonClicked),
              concatLatestFrom(() => this.store.select(selectUrl)),
              tap(([action, currentUrl]) => {
                let urlTree = this.router.parseUrl(currentUrl);
                urlTree.queryParams = {};
                urlTree.fragment = null;
                this.router.navigate([urlTree.toString(), 'details', action.id]);
            })
          )},
          { dispatch: false }
        );

        searchByUrl$`
    ];

    safeReplace(
      `Add import and replace 'searchByUrl$' in ${filePath}`,
      filePath,
      find,
      replaceWith,
      tree,
    );
  }
  getTitle(): string {
    return "Adapting Search Effects"
  }
}
