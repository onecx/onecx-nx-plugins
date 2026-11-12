import { Tree } from '@nx/devkit';
import { safeReplace } from '@onecx/generator-utils';

export function ensurePortalDialogProvider(tree: Tree, moduleFilePath: string) {
  const content = tree.read(moduleFilePath, 'utf8');
  if (content === null) {
    throw new Error(
      `Cannot configure dialog providers: ${moduleFilePath} is missing.`
    );
  }
  if (content.includes('providePortalDialogService()')) {
    return;
  }

  const providers = /providers:\s*\[/;
  safeReplace(
    'Add the portal dialog provider without changing existing providers',
    moduleFilePath,
    [/^/, providers.test(content) ? providers : /imports:\s*\[/],
    [
      content.includes('providePortalDialogService')
        ? ''
        : "import { providePortalDialogService } from '@onecx/angular-accelerator';\n",
      providers.test(content)
        ? 'providers: [providePortalDialogService(), '
        : 'providers: [providePortalDialogService()],\n  imports: [',
    ],
    tree
  );
}
