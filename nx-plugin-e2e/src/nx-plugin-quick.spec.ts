import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import * as os from 'os';
import { assertGeneratedGuardrails } from './guardrails.utils';

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

    const project = JSON.parse(
      readFileSync(join(projectDirectory, 'project.json'), 'utf-8')
    );
    expect(project.targets.build.executor).toBe('@nx/rspack:rspack');
    expect(project.targets.serve.executor).toBe('@nx/rspack:dev-server');
    expect(existsSync(join(projectDirectory, 'webpack.config.js'))).toBe(false);
    const installedGenerator = JSON.parse(
      readFileSync(
        join(
          projectDirectory,
          'node_modules/@onecx/angular-generator/package.json'
        ),
        'utf-8'
      )
    );
    expect(installedGenerator.name).toBe('@onecx/angular-generator');
    expect(installedGenerator.version).toBe('0.0.0-e2e');
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
    execSync('npm ls @onecx/angular-generator', {
      cwd: projectDirectory,
      stdio: 'inherit',
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
        `nx generate @onecx/angular-generator:feature ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
    });

    it('should add a search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a search page #######################');

      execSync(
        `nx generate @onecx/angular-generator:search ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
    });

    it('should add a details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'allowDelete', value: 'true' },
      ]);
      console.log('### ==> should add a details page #######################');

      execSync(
        `nx generate @onecx/angular-generator:details ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
    });

    it('should add a create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log(
        '### ==> should add a create-update dialog #######################'
      );

      execSync(
        `nx generate @onecx/angular-generator:create-update ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
    });

    it('should add a delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a delete dialog #######################');

      execSync(
        `nx generate @onecx/angular-generator:delete ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:ngrx-page ${featureName} ${parameterString}`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:feature ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:search ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
    });

    it('should add a custom named details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'updateRequestName', value: 'CustomDataObjectUpdateRequest' },
        { key: 'updateResponseName', value: 'CustomDataObjectUpdateResponse' },
        { key: 'allowDelete', value: 'true' },
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'getResponseName', value: 'CustomDataObjectGetResponse' },
      ]);
      console.log('### ==> should add a custom named details page ###########');

      execSync(
        `nx generate @onecx/angular-generator:details ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:create-update ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:delete ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
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
        `nx generate @onecx/angular-generator:pre-commit-validation ${parameterString} --verbose`,
        tcOption
      );
    });
  });

  it('should build and test once after all generators', () => {
    const tcOption = { ...option, cwd: projectDirectory };
    console.log('### ==> final build + test ###############################');

    execSync(`nx run build --skip-nx-cache`, tcOption);
    // The Rspack production build must emit the Module Federation remote entry.
    expect(
      existsSync(join(projectDirectory, 'dist', projectName, 'remoteEntry.js'))
    ).toBe(true);
    // The patch-loader rewrites primeng's `document.createElement` to the
    // `document.createElementFromPrimeNg` hook; the generated app must ship a default for that
    // hook (in its polyfills) or a standalone app crashes when served without a shell host.
    expect(
      readFileSync(join(projectDirectory, 'src', 'polyfills.ts'), 'utf-8')
    ).toContain('createElementFromPrimeNg');
    // The extract-i18n target (kept on @angular/build:extract-i18n) must run and write a
    // translation bundle (`messages.xlf` at the app root by default).
    execSync(`nx run extract-i18n --skip-nx-cache`, tcOption);
    const xlfFile = join(projectDirectory, 'messages.xlf');
    expect(existsSync(xlfFile)).toBe(true);
    expect(readFileSync(xlfFile, 'utf-8').length).toBeGreaterThan(0);

    execSync(`nx run test --skip-nx-cache`, tcOption);
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
  assertGeneratedGuardrails(projectDirectory);

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
