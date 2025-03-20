import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync } from 'fs';
import * as os from 'os';
const NON_INTERACTIVE_KEY = 'non-interactive';
const projectName = 'test-project';
const featureName = 'test-feature';
const featureNameCustom = 'test-custom-feature';
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
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:search ${featureName} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );

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
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:details ${featureName} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add a create-update dialog', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:create-update ${featureName} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add a delete dialog', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:delete ${featureName} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add an empty ngrx-page', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'pageName',
        value: 'Test',
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:ngrx-page ${featureName} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should add a custom named feature', () => {
    execSync(
      `nx generate @onecx/nx-plugin:feature ${featureNameCustom} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add a custom named search page', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'apiServiceName',
        value: 'CustomService',
      },
      {
        key: 'dataObjectName',
        value: 'CustomDataObject',
      },
      {
        key: 'searchRequestName',
        value: 'CustomDataObjectSearchRequest',
      },
      {
        key: 'searchResponseName',
        value: 'CustomDataObjectSearchResponse',
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:search ${featureNameCustom} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );

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

  it('should add a custom named details page', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'apiServiceName',
        value: 'CustomService',
      },
      {
        key: 'dataObjectName',
        value: 'CustomDataObject',
      },
      {
        key: 'getByIdResponseName',
        value: 'GetCustomDataObjectByIdResponse',
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:details ${featureNameCustom} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add a custom named create-update dialog', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'apiServiceName',
        value: 'CustomService',
      },
      {
        key: 'dataObjectName',
        value: 'CustomDataObject',
      },
      {
        key: 'createRequestName',
        value: 'CustomCreateDataObject',
      },
      {
        key: 'createResponseName',
        value: 'DataObjectCustomCreationResponse',
      },
      {
        key: 'updateRequestName',
        value: 'DataObjectCustomUpdate',
      },
      {
        key: 'updateResponseName',
        value: 'DataObjectCustomUpdateResponse',
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:create-update ${featureNameCustom} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add a custom named delete dialog', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'apiServiceName',
        value: 'CustomService',
      },
      {
        key: 'dataObjectName',
        value: 'CustomDataObject',
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:delete ${featureNameCustom} ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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

  it('should add pre commit validation', () => {
    // Add all required parameters to this array with a value.
    // As tests are non-interactive, not-added but required items will block the test
    const requiredParameters = [
      {
        key: NON_INTERACTIVE_KEY,
        value: true,
      },
      {
        key: 'enableEslint',
        value: true,
      },
      {
        key: 'enableConventionalCommits',
        value: true,
      },
      {
        key: 'enableDetectSecrets',
        value: true,
      },
    ];

    const parameterString = requiredParameters
      .map((o) => `--${o.key} ${o.value}`)
      .join(' ');

    execSync(
      `nx generate @onecx/nx-plugin:pre-commit-validation ${parameterString} --verbose`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
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
