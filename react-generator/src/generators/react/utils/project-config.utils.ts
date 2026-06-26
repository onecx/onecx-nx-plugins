import {
  names,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { ReactGeneratorSchema } from '../schema';

export function adaptProjectConfiguration(
  tree: Tree,
  options: ReactGeneratorSchema
) {
  const projectName = names(options.name).fileName;
  const config = readProjectConfiguration(tree, projectName);
  config.targets['serve'].executor = '@nx/vite:dev-server';
  config.targets['serve'].options = {
    ...(config.targets['serve'].options ?? {}),
    host: '0.0.0.0',
    port: 4200,
    headers: {
      Allow: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    },
  };
  config.targets['build'].executor = '@nx/vite:build';
  config.targets['build'].options = {
    ...(config.targets['build'].options ?? {}),
    outputPath: 'dist',
    assets: [
      ...(config.targets['build'].options?.assets ?? []),
      {
        glob: '**/*',
        input: './node_modules/@onecx/react-utils/assets/',
        output: '/onecx-react-utils/assets/',
      },
    ],
  };
  config.targets['build'].configurations = {
    ...(config.targets['build'].configurations ?? {}),
    production: {
      ...(config.targets['build'].configurations?.production ?? {}),
      fileReplacements: [
        ...(config.targets['build'].configurations?.production
          ?.fileReplacements ?? []),
        {
          replace: 'src/environments/environment.ts',
          with: 'src/environments/environment.prod.ts',
        },
      ],
    },
  };
  config.targets['test'].executor = '@nx/vitest:test';
  updateProjectConfiguration(tree, projectName, config);
}
