import { execSync } from 'child_process';
import { mkdirSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { assertGeneratedGuardrails } from './guardrails.utils';

/**
 * Creates an isolated test workspace and returns its directory.
 * Generated files are retained for inspection.
 */
export function createTestProject(flavor: string, projectName: string) {
  const outputDirectory = join(
    process.env.WORKING_DIR ?? tmpdir(),
    'nx-plugin-out'
  );
  mkdirSync(outputDirectory, { recursive: true });
  const workingDirectory = mkdtempSync(join(outputDirectory, 'run-'));
  const projectDirectory = join(workingDirectory, projectName);

  execSync(
    `npx --yes @onecx/create-workspace@e2e ${flavor} ${projectName} --nxCloud skip --no-interactive --verbose`,
    {
      cwd: workingDirectory,
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);
  assertGeneratedGuardrails(projectDirectory);

  return projectDirectory;
}
