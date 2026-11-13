import { generateFiles } from '@nx/devkit';
import { createTree } from '@nx/devkit/testing';
import { join } from 'path';

describe('feature module template', () => {
  it.each([false, true])(
    'generates one valid provider list with standalone=%s',
    (standalone) => {
      const tree = createTree();
      generateFiles(tree, join(__dirname, 'files/ngrx'), '.', {
        featureFileName: 'book',
        featureClassName: 'Book',
        featurePropertyName: 'book',
        standalone,
      });

      const module = tree.read('src/app/book/book.module.ts', 'utf8')!;
      expect(module.match(/providers:\s*\[/g)).toHaveLength(1);
      expect(module).toContain('providePortalDialogService()');
      expect(module).toContain('PermissionService');
      expect(module.includes('provideAlwaysGrantPermissionChecker()')).toBe(
        standalone
      );
      expect(module).not.toContain('HAS_PERMISSION_CHECKER');
      expect(module.match(/from '@angular\/forms'/g)).toHaveLength(1);
    }
  );
});
