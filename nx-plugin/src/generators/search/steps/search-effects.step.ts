import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class SearchEffectsStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.effects.ts`;

    let htmlContent = tree.read(filePath, 'utf8');
    htmlContent =
      `import { selectUrl } from 'src/app/shared/selectors/router.selectors';` +
      htmlContent.replace(
        'searchByUrl$',
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
      );
    tree.write(filePath, htmlContent);
  }
  getName(): string {
    return "Adapting Search Effects"
  }
}
