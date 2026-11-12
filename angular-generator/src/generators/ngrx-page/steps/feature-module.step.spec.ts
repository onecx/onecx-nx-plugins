import { createTree } from '@nx/devkit/testing';
import { FeatureModuleStep } from './feature-module.step';

describe('NgRx page FeatureModuleStep', () => {
  it('imports the standalone page and registers its NgRx effect', () => {
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
      pageName: 'Dashboard',
      pageTitle: 'Dashboard',
    });

    const moduleContent = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(moduleContent).toContain('imports: [\n      DashboardComponent,');
    expect(moduleContent).toContain(
      'EffectsModule.forFeature([DashboardEffects,])'
    );
    expect(moduleContent).not.toContain('declarations:');
  });
});
