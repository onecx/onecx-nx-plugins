import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync } from 'fs';

//TODO: change to test-project and test-feature
const projectName = 'constr-task-mgmt';
const featureName = 'construction-task';
describe('nx-plugin', () => {
  let projectDirectory: string;

  beforeAll(() => {
    projectDirectory = createTestProject('ngrx');

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install @onecx/nx-plugin@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  afterAll(() => {
    // Cleanup the test project
    // rmSync(projectDirectory, {
    //   recursive: true,
    //   force: true,
    // });
return;
    //Delete files to make it easier to compare with original
    rmSync(join(projectDirectory, 'node_modules'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, 'dist'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, '.angular'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, '.nx'), {
      recursive: true,
      force: true,
    });
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls @onecx/nx-plugin', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run test --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should add a feature', () => {
    execSync(`nx generate @onecx/nx-plugin:feature ${featureName} --verbose`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run test --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should add a search page', () => {
    execSync(`nx generate @onecx/nx-plugin:search ${featureName} --verbose`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run test --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should add a details page', () => {
    execSync(`nx generate @onecx/nx-plugin:details ${featureName} --verbose`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    execSync(`nx run test --skip-nx-cache --coverage`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });
});

/**
 * Creates a test project with @onecx/create-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject(flavor) {
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npx --yes @onecx/create-workspace@e2e ${flavor} ${projectName} --nxCloud skip --no-interactive --verbose`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}
