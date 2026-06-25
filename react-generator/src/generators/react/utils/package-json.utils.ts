import { names, Tree, updateJson } from '@nx/devkit';
import { ReactGeneratorSchema } from '../schema';

export function addBaseToPackageJson(
  tree: Tree,
  options: ReactGeneratorSchema
) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.name = 'onecx-' + names(options.name).fileName + '-ui';
    pkgJson.private = true;
    pkgJson.license = 'Apache-2.0';

    const pluginKey = '@onecx/react-generator';
    const pluginVersion = pkgJson.dependencies?.[pluginKey];
    if (pluginVersion) {
      delete pkgJson.dependencies[pluginKey];
      pkgJson.devDependencies = pkgJson.devDependencies ?? {};
      pkgJson.devDependencies[pluginKey] = pluginVersion;
    }

    return pkgJson;
  });
}

export function addScriptsToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.scripts = pkgJson.scripts ?? {};
    pkgJson.scripts[
      'apigen'
    ] = `openapi-generator-cli generate -i src/assets/api/openapi-bff.yaml -o src/api/generated -g typescript-fetch --type-mappings AnyType=object --additional-properties=removeOperationIdPrefix=true,removeOperationIdPrefixCount=2`;
    pkgJson.scripts['start'] = 'nx serve';
    pkgJson.scripts['dev'] = 'vite';
    pkgJson.scripts['build'] = `nx build`;
    pkgJson.scripts['preview'] = 'vite preview';
    pkgJson.scripts['preview:host'] = 'vite preview --host';
    pkgJson.scripts['clean'] =
      'npm cache clean --force && npx clear-npx-cache && rm -rf *.log dist reports .nx .eslintcache ./node_modules/.cache/prettier/.prettier-cache';
    pkgJson.scripts['format'] = 'nx format:write --uncommitted';
    pkgJson.scripts['lint'] = 'nx lint';
    pkgJson.scripts['lint:fix'] = 'nx lint --fix';
    pkgJson.scripts['sonar'] = 'npx sonar-scanner';
    pkgJson.scripts['test'] = 'nx test';
    pkgJson.scripts['test:ci'] = 'nx test --watch=false --coverage';
    return pkgJson;
  });
}
