import { Tree, updateJson } from '@nx/devkit';

export function adaptTsConfig(tree: Tree) {
  updateJson(tree, 'tsconfig.json', (json) => {
    json.compilerOptions = json.compilerOptions ?? {};
    json.compilerOptions.target = 'ES2022';
    json.compilerOptions.module = 'ESNext';
    json.compilerOptions.lib = ['ES2022', 'dom'];
    json.compilerOptions.moduleResolution = 'bundler';
    json.compilerOptions.resolveJsonModule = true;
    delete json.compilerOptions.emitDecoratorMetadata;
    delete json.compilerOptions.experimentalDecorators;
    return json;
  });

  updateJson(tree, 'tsconfig.app.json', (json) => {
    json.files = ['src/main.tsx', 'src/bootstrap.ts'];
    json.compilerOptions = json.compilerOptions ?? {};
    json.compilerOptions.jsx = 'react-jsx';
    json.compilerOptions.resolveJsonModule = true;
    return json;
  });
}
