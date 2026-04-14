import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import * as os from 'os';

const NON_INTERACTIVE_KEY = 'non-interactive';
const projectName = 'test-project';
const featureName = 'test-feature';
const featureNameCustom = 'test-custom-feature';
const resourceName = 'TestResource';

describe('nx-plugin', () => {
  let projectDirectory: string;
  const option: ExecSyncOptionsWithBufferEncoding = {
    stdio: 'inherit',
    env: process.env,
  };

  beforeAll(() => {
    projectDirectory = createTestProject('ngrx');

    // Upgrade Nx to version 22.0.2 to match the plugin's peer dependencies
    console.log('Upgrading Nx to version 22.0.2...');
    execSync(`npx nx migrate 22.0.2`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: { ...process.env, NX_NO_CLOUD: 'true', CI: 'true' },
    });

    // Run migrations if migrations.json was created
    if (existsSync(`${projectDirectory}/migrations.json`)) {
      console.log('Installing dependencies for migration...');
      execSync(`npm install`, {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('Running migrations...');
      execSync(`npx nx migrate --run-migrations`, {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('Cleaning up migration artifacts...');
      execSync(`rm migrations.json`, {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      });
    }

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

  beforeEach(() => {
    console.log('########################################################');
  });

  describe('use presettings', () => {
    it('should add a feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a feature ###########################');
      console.log(tcOption);

      execSync(
        `nx generate @onecx/nx-plugin:feature ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a search page #######################');

      execSync(
        `nx generate @onecx/nx-plugin:search ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'allowDelete', value: 'true' },
      ]);
      console.log('### ==> should add a details page #######################');

      execSync(
        `nx generate @onecx/nx-plugin:details ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log(
        '### ==> should add a create-update dialog #######################'
      );

      execSync(
        `nx generate @onecx/nx-plugin:create-update ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a delete dialog #######################');

      execSync(
        `nx generate @onecx/nx-plugin:delete ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add an empty ngrx-page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        {
          key: 'pageName',
          value: 'Test',
        },
        {
          key: 'pageTitle',
          value: 'Page Title',
        },
      ]);
      console.log(
        '### ==> should add an empty ngrx-page #######################'
      );

      execSync(
        `nx generate @onecx/nx-plugin:ngrx-page ${featureName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
    });
  });

  describe('use custom names instead presettings', () => {
    it('should add a custom named feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
      ]);
      console.log('### ==> should add a custom named feature ################');

      execSync(
        `nx generate @onecx/nx-plugin:feature ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a custom named search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'searchRequestName', value: 'CustomDataObjectSearchRequest' },
        { key: 'searchResponseName', value: 'CustomDataObjectSearchResponse' },
      ]);
      console.log('### ==> should add a custom named search page ############');

      execSync(
        `nx generate @onecx/nx-plugin:search ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'getResponseName', value: 'CustomDataObjectGetResponse' },
      ]);
      console.log('### ==> should add a custom named details page ###########');

      execSync(
        `nx generate @onecx/nx-plugin:details ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'createRequestName', value: 'CustomDataObjectCreateRequest' },
        { key: 'createResponseName', value: 'CustomDataObjectCreateResponse' },
        { key: 'updateRequestName', value: 'CustomDataObjectUpdateRequest' },
        { key: 'updateResponseName', value: 'CustomDataObjectUpdateResponse' },
      ]);
      console.log('### ==> should add a custom named create-update dialog ##');

      execSync(
        `nx generate @onecx/nx-plugin:create-update ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'deleteRequestName', value: 'CustomDataObjectDeleteRequest' },
        { key: 'deleteResponseName', value: 'CustomDataObjectDeleteResponse' },
      ]);
      console.log('### ==> should add a custom named delete dialog ##########');

      execSync(
        `nx generate @onecx/nx-plugin:delete ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });
  });

  describe('extras', () => {
    it('should add pre commit validation', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'enableEslint', value: true },
        { key: 'enableConventionalCommits', value: true },
        { key: 'enableDetectSecrets', value: true },
      ]);
      console.log('### ==> should add pre commit validation #################');

      execSync(
        `nx generate @onecx/nx-plugin:pre-commit-validation ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });
  });
});

/**
 * Creates a test project with @onecx/create-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject(flavor) {
  const workingDir = process.env.WORKING_DIR ?? os.tmpdir();
  const projectDirectory = join(workingDir, 'nx-plugin-out', projectName);

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

/**
 * Creates a string of CLI parameters from the given array of key-value pairs, adding a non-interactive parameter to ensure the generators run without blocking for user input.
 * @param parameters Array of key-value pairs representing CLI parameters
 * @returns A string of CLI parameters
 */
function getParameterAsString(parameters: { key: string; value: unknown }[]) {
  // As tests are non-interactive, not-added but required items will block the test
  const nonInteractiveParameter = {
    key: NON_INTERACTIVE_KEY,
    value: true,
  };
  return [nonInteractiveParameter, ...parameters]
    .map((o) => `--${o.key} ${o.value}`)
    .join(' ');
}
