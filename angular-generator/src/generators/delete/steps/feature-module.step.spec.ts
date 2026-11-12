import { createTree } from '@nx/devkit/testing';
import { FeatureModuleStep } from './feature-module.step';

const options = {
  featureName: 'Books',
  resource: 'Book',
  customizeNamingForAPI: false,
  serviceName: 'BookAPIService',
};

describe('Delete FeatureModuleStep', () => {
  it('adds dialog support to a module without declarations and preserves providers', () => {
    const tree = createTree();
    tree.write(
      'src/app/books/books.module.ts',
      `@NgModule({
  providers: [PermissionService],
  imports: [EffectsModule.forFeature([])],
})
export class BooksModule {}`
    );

    new FeatureModuleStep().process(tree, options);
    new FeatureModuleStep().process(tree, options);

    const content = tree.read('src/app/books/books.module.ts', 'utf8');
    expect(content).toContain(
      'providers: [providePortalDialogService(), PermissionService]'
    );
    expect(content.match(/providePortalDialogService/g)).toHaveLength(2);
    expect(content).not.toContain('declarations:');
  });
});
