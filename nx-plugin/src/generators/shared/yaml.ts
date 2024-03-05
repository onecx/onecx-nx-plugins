import { Tree } from '@nx/devkit';
import { parse, stringify } from 'yaml';

export function readYaml<T extends object = any>(tree: Tree, path: string): T {
  if (!tree.exists(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  try {
    return parse(tree.read(path, 'utf-8'));
  } catch (e) {
    throw new Error(`Cannot parse ${path}: ${e.message}`);
  }
}

export function writeYaml<T extends object = object>(
  tree: Tree,
  path: string,
  value: T
): void {
  tree.write(path, stringify(value));
}

export function updateYaml<T extends object = any, U extends object = T>(
  tree: Tree,
  path: string,
  updater: (value: any) => U
) {
  const updatedValue = updater(readYaml(tree, path));
  writeYaml(tree, path, updatedValue);
}
