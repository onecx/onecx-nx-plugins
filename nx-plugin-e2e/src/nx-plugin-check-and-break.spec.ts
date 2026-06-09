import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import * as os from 'os';

const NON_INTERACTIVE_KEY = 'non-interactive';
const projectName = 'test-project';
const featureName = 'test-feature';
const featureNameCustom = 'test-custom-feature';
const resourceName = 'TestResource';
const nxMigrationTarget = '20.8.4';

/**
 * checkAndBreak wraps a test body so that, once any preceding test in the
 * suite has thrown, subsequent tests return early (no-op).  The thrown error
 * is still re-thrown so Jest reports the failure.
 */
let suiteFailed = false;
function checkAndBreak(testName: string, fn: () => void): () => void {
  return () => {
    if (suiteFailed) {
      console.warn(`SKIP: "${testName}" — previous test in pipeline failed`);
      return;
    }
    try {
      fn();
    } catch (err) {
      suiteFailed = true;
      console.error(
        `FAIL: "${testName}" broke the pipeline — remaining tests will be skipped`
      );
      throw err;
    }
  };
}

describe('nx-plugin', () => {
  let projectDirectory: string;
  const option: ExecSyncOptionsWithBufferEncoding = {
    stdio: 'inherit',
    env: process.env,
  };

  beforeAll(() => {
    projectDirectory = createTestProject('ngrx');

    console.log(`Upgrading Nx to version ${nxMigrationTarget}...`);
    execSync(`npx nx migrate ${nxMigrationTarget}`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: { ...process.env, NX_NO_CLOUD: 'true', CI: 'true' },
    });

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

    execSync(`npm install @onecx/nx-plugin@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  afterAll(() => {
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

  it('should be installed', checkAndBreak('should be installed', () => {
    execSync('npm ls @onecx/nx-plugin', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  }));

  beforeEach(() => {
    console.log('########################################################');
  });

  describe('use presettings', () => {
    it('should add a feature', checkAndBreak('should add a feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a feature ###########################');
      console.log(tcOption);

      execSync(
        `nx generate @onecx/nx-plugin:feature ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
    }));

    it('should add a search page', checkAndBreak('should add a search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a search page #######################');

      execSync(
        `nx generate @onecx/nx-plugin:search ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
    }));

    it('should add a details page', checkAndBreak('should add a details page', () => {
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
    }));

    it('should add a create-update dialog', checkAndBreak('should add a create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log(
        '### ==> should add a create-update dialog #######################'
      );

      execSync(
        `nx generate @onecx/nx-plugin:create-update ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
    }));

    it('should add a delete dialog', checkAndBreak('should add a delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a delete dialog #######################');

      execSync(
        `nx generate @onecx/nx-plugin:delete ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
    }));

    it('should add an empty ngrx-page', checkAndBreak('should add an empty ngrx-page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'pageName', value: 'Test' },
        { key: 'pageTitle', value: 'Page Title' },
      ]);
      console.log(
        '### ==> should add an empty ngrx-page #######################'
      );

      execSync(
        `nx generate @onecx/nx-plugin:ngrx-page ${featureName} ${parameterString}`,
        tcOption
      );
    }));
  });

  describe('use custom names instead presettings', () => {
    it('should add a custom named feature', checkAndBreak('should add a custom named feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
      ]);
      console.log('### ==> should add a custom named feature ################');

      execSync(
        `nx generate @onecx/nx-plugin:feature ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
    }));

    it('should add a custom named search page', checkAndBreak('should add a custom named search page', () => {
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
    }));

    it('should add a custom named details page', checkAndBreak('should add a custom named details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'updateRequestName', value: 'CustomDataObjectUpdateRequest' },
        { key: 'updateResponseName', value: 'CustomDataObjectUpdateResponse' },
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'getResponseName', value: 'CustomDataObjectGetResponse' },
      ]);
      console.log('### ==> should add a custom named details page ###########');

      execSync(
        `nx generate @onecx/nx-plugin:details ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
    }));

    it('should add a custom named create-update dialog', checkAndBreak('should add a custom named create-update dialog', () => {
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
    }));

    it('should add a custom named delete dialog', checkAndBreak('should add a custom named delete dialog', () => {
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
    }));
  });

  describe('extras', () => {
    it('should add pre commit validation', checkAndBreak('should add pre commit validation', () => {
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
    }));
  });

  it('should build and test once after all generators', checkAndBreak('should build and test once after all generators', () => {
    const tcOption = { ...option, cwd: projectDirectory };
    console.log('### ==> final build + test ###############################');

    execSync(`nx run build --skip-nx-cache`, tcOption);
    execSync(`nx run test --skip-nx-cache`, tcOption);
  }));
});

function createTestProject(flavor: string) {
  const workingDir = process.env.WORKING_DIR ?? os.tmpdir();
  const projectDirectory = join(workingDir, 'nx-plugin-out', projectName);

  rmSync(projectDirectory, { recursive: true, force: true });
  mkdirSync(dirname(projectDirectory), { recursive: true });

  execSync(
    `npx --yes @onecx/create-workspace@e2e ${flavor} ${projectName} --nxCloud skip --no-interactive --verbose`,
    { cwd: dirname(projectDirectory), stdio: 'inherit', env: process.env }
  );
  console.log(`Created test project in "${projectDirectory}"`);
  return projectDirectory;
}

function getParameterAsString(parameters: { key: string; value: unknown }[]) {
  const nonInteractiveParameter = { key: NON_INTERACTIVE_KEY, value: true };
  return [nonInteractiveParameter, ...parameters]
    .map((o) => `--${o.key} ${o.value}`)
    .join(' ');
}
