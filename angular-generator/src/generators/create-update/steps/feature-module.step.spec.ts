import { createTree } from '@nx/devkit/testing';
import { FeatureModuleStep } from './feature-module.step';

const options = {
  featureName: 'Books',
  resource: 'Book',
  customizeNamingForAPI: false,
  serviceName: 'BookAPIService',
  createRequestName: 'CreateBookRequest',
  createResponseName: 'CreateBookResponse',
  updateRequestName: 'UpdateBookRequest',
  updateResponseName: 'UpdateBookResponse',
  createRequestPropertyName: 'createBookRequest',
  createResponsePropertyName: 'createBookResponse',
  updateRequestPropertyName: 'updateBookRequest',
  updateResponsePropertyName: 'updateBookResponse',
};

describe('CreateUpdate FeatureModuleStep', () => {
  it('imports the dialog without duplicate provider or UI module imports', () => {
    const tree = createTree();
    tree.write(
      'src/app/books/books.module.ts',
      `
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator';
@NgModule({
  providers: [providePortalDialogService()],
  imports: [
    AngularAcceleratorModule,
  ],
})
export class BooksModule {}
`
    );

    new FeatureModuleStep().process(tree, options);

    const moduleContent = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(moduleContent).toContain(
      'imports: [\n      BookCreateUpdateComponent,'
    );
    expect(moduleContent.match(/providePortalDialogService/g)).toHaveLength(2);
    expect(moduleContent).not.toContain('FloatLabelModule');
    expect(moduleContent).not.toContain('InputTextModule');
    expect(moduleContent).not.toContain('declarations:');
  });

  it('adds the dialog provider import and registration when absent', () => {
    const tree = createTree();
    tree.write(
      'src/app/books/books.module.ts',
      `
import { AngularAcceleratorModule } from '@onecx/angular-accelerator';
@NgModule({
  imports: [
    AngularAcceleratorModule,
  ],
})
export class BooksModule {}
`
    );

    new FeatureModuleStep().process(tree, options);

    const moduleContent = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(moduleContent).toContain(
      "import { providePortalDialogService } from '@onecx/angular-accelerator';"
    );
    expect(moduleContent).toContain(
      'providers: [providePortalDialogService()]'
    );
    expect(moduleContent.match(/providePortalDialogService/g)).toHaveLength(2);
    expect(moduleContent).not.toContain('declarations:');
  });
});
