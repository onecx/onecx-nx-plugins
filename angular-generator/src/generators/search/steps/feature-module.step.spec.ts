import { createTree } from '@nx/devkit/testing';
import { FeatureModuleStep } from './feature-module.step';

describe('Search FeatureModuleStep', () => {
  it('imports the standalone component and preserves its NgRx effect', () => {
    const tree = createTree();
    tree.write(
      'src/app/books/books.module.ts',
      `
import { EffectsModule } from '@ngrx/effects';
@NgModule({
  imports: [
    EffectsModule.forFeature(),
  ],
})
export class BooksModule {}
`
    );

    new FeatureModuleStep().process(tree, {
      featureName: 'Books',
      resource: 'Book',
      customizeNamingForAPI: false,
      existStrategy: 'skip',
      searchRequestName: 'SearchBooksRequest',
      searchResponseName: 'SearchBooksResponse',
      serviceName: 'BookAPIService',
    });

    const moduleContent = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(moduleContent).toContain('imports: [\n      BookSearchComponent,');
    expect(moduleContent).toContain(
      'EffectsModule.forFeature([BookSearchEffects,])'
    );
    expect(moduleContent).not.toContain('FloatLabelModule');
    expect(moduleContent).not.toContain('InputTextModule');
    expect(moduleContent).not.toContain('declarations:');
  });
});
