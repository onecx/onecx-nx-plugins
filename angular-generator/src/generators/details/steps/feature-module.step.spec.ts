import { createTree } from '@nx/devkit/testing';
import { FeatureModuleStep } from './feature-module.step';

describe('Details FeatureModuleStep', () => {
  it('imports the standalone component and keeps details effects registered', () => {
    const tree = createTree();
    tree.write(
      'src/app/books/books.module.ts',
      `
import { EffectsModule } from '@ngrx/effects';
import { providePortalDialogService } from '@onecx/angular-accelerator';
@NgModule({
  providers: [providePortalDialogService()],
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
      serviceName: 'BookAPIService',
      getResponseName: 'GetBookResponse',
      editMode: true,
      allowDelete: false,
      updateRequestName: 'UpdateBookRequest',
      updateResponseName: 'UpdateBookResponse',
    });

    const moduleContent = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(moduleContent).toContain('imports: [\n      BookDetailsComponent,');
    expect(moduleContent).toContain(
      'EffectsModule.forFeature([BookDetailsEffects,])'
    );
    expect(moduleContent).toContain('providePortalDialogService()');
    expect(moduleContent).not.toContain('FloatLabelModule');
    expect(moduleContent).not.toContain('InputTextModule');
    expect(moduleContent).not.toContain('declarations:');
  });
});
