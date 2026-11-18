import { createTree } from '@nx/devkit/testing';
import { FeatureStateStep } from './feature-state.step';

describe('NgRx page FeatureStateStep', () => {
  it.each([
    ['Book', 'BookState as BookPageState', 'book: BookPageState'],
    ['Overview', 'OverviewState', 'overview: OverviewState'],
  ])(
    'adds the %s page state without conflicting with the feature',
    (pageName, importName, field) => {
      const tree = createTree();
      tree.write('src/app/book/book.state.ts', 'export interface BookState {}');

      new FeatureStateStep().process(tree, {
        featureName: 'book',
        pageName,
        pageTitle: pageName,
      });

      const state = tree.read('src/app/book/book.state.ts', 'utf8');
      expect(state).toContain(`import { ${importName} }`);
      expect(state).toContain(field);
    }
  );
});
