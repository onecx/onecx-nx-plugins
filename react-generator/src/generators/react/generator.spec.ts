/** @jest-environment node */
import { readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import reactGenerator from './generator';

describe('React quality guardrails', () => {
  const argv = process.argv;
  beforeAll(() => {
    process.argv = [...argv, '--non-interactive'];
  });
  afterAll(() => {
    process.argv = argv;
  });

  it.each(['primeflex', 'tailwind'] as const)(
    'installs quality checks for %s styling',
    async (styles) => {
      const tree = createTreeWithEmptyWorkspace();
      await reactGenerator(tree, { name: 'example', styles, aiTool: 'none' });

      expect(tree.exists('.husky/pre-commit')).toBe(true);
      expect(tree.exists('scripts/pre-commit-qa')).toBe(true);
      expect(readJson(tree, 'package.json')).toMatchObject({
        scripts: {
          prepare: 'husky',
          lint: 'npm run lint:eslint && npm run lint:styles',
          prettier: 'prettier --check .',
          'sonar:scan': 'sonar-scanner',
        },
        devDependencies: {
          husky: '^9.1.7',
          'stylelint-config-standard': '^38.0.0',
        },
      });
      expect(readJson(tree, 'package.json').scripts.sonar).toBeUndefined();
      expect(
        readJson(tree, '.stylelintrc.json').rules['at-rule-no-unknown'][1]
          .ignoreAtRules
      ).toContain('theme');
    },
    60000
  );
});
